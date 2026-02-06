package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/prabalesh/vigileye/database"
	"github.com/prabalesh/vigileye/middleware"
	"github.com/prabalesh/vigileye/models"
)

func GetProjects(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)

	rows, err := database.DB.Query(`
		SELECT p.id, p.name, p.owner_id, p.created_at 
		FROM projects p
		LEFT JOIN project_members pm ON p.id = pm.project_id
		WHERE p.owner_id = $1 OR pm.user_id = $1
		GROUP BY p.id
	`, userID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	projects := []models.Project{}
	for rows.Next() {
		var p models.Project
		if err := rows.Scan(&p.ID, &p.Name, &p.OwnerID, &p.CreatedAt); err != nil {
			continue
		}
		projects = append(projects, p)
	}

	json.NewEncoder(w).Encode(projects)
}

func CreateProject(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)

	var input struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	var p models.Project
	err = tx.QueryRow(
		"INSERT INTO projects (name, owner_id) VALUES ($1, $2) RETURNING id, name, owner_id, created_at",
		input.Name, userID,
	).Scan(&p.ID, &p.Name, &p.OwnerID, &p.CreatedAt)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Create default environments
	envs := []string{"production", "staging", "development"}
	createdEnvs := []models.Environment{}

	for _, name := range envs {
		var e models.Environment
		err = tx.QueryRow("INSERT INTO environments (project_id, name) VALUES ($1, $2) RETURNING id, project_id, name, api_key, settings, is_active, created_at", p.ID, name).
			Scan(&e.ID, &e.ProjectID, &e.Name, &e.APIKey, &e.Settings, &e.IsActive, &e.CreatedAt)
		if err != nil {
			http.Error(w, "Database error creating environments", http.StatusInternalServerError)
			return
		}
		createdEnvs = append(createdEnvs, e)
	}

	// Add creator as admin member
	_, err = tx.Exec("INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, 'admin')", p.ID, userID)
	if err != nil {
		http.Error(w, "Database error adding member", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Database error committing", http.StatusInternalServerError)
		return
	}

	type ProjectWithEnvs struct {
		models.Project
		Environments []models.Environment `json:"environments"`
	}

	json.NewEncoder(w).Encode(ProjectWithEnvs{
		Project:      p,
		Environments: createdEnvs,
	})
}

func GetProject(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])

	// Check access
	var exists bool
	err := database.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM projects p
			LEFT JOIN project_members pm ON p.id = pm.project_id
			WHERE p.id = $1 AND (p.owner_id = $2 OR pm.user_id = $2)
		)
	`, projectID, userID).Scan(&exists)

	if err != nil || !exists {
		http.Error(w, "Project not found or access denied", http.StatusNotFound)
		return
	}

	var p models.Project
	err = database.DB.QueryRow(
		"SELECT id, name, owner_id, created_at FROM projects WHERE id = $1",
		projectID,
	).Scan(&p.ID, &p.Name, &p.OwnerID, &p.CreatedAt)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(p)
}

func AddProjectMember(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])

	// Check if requester is admin
	var isAdmin bool
	err := database.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM project_members 
			WHERE project_id = $1 AND user_id = $2 AND role = 'admin'
		) OR (SELECT owner_id FROM projects WHERE id = $1) = $2
	`, projectID, userID).Scan(&isAdmin)

	if err != nil || !isAdmin {
		http.Error(w, "Unauthorized: Only admins can add members", http.StatusForbidden)
		return
	}

	var input struct {
		UserEmail string `json:"user_email"`
		Role      string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	var newUserID int
	err = database.DB.QueryRow("SELECT id FROM users WHERE email = $1", input.UserEmail).Scan(&newUserID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	_, err = database.DB.Exec(
		"INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3",
		projectID, newUserID, input.Role,
	)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func RemoveProjectMember(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	targetUserID, _ := strconv.Atoi(vars["user_id"])

	// Check if requester is admin
	var isAdmin bool
	err := database.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM project_members 
			WHERE project_id = $1 AND user_id = $2 AND role = 'admin'
		) OR (SELECT owner_id FROM projects WHERE id = $1) = $2
	`, projectID, userID).Scan(&isAdmin)

	if err != nil || !isAdmin {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	_, err = database.DB.Exec("DELETE FROM project_members WHERE project_id = $1 AND user_id = $2", projectID, targetUserID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
