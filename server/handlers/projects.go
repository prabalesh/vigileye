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

	type ProjectWithMembers struct {
		models.Project
		Environments []models.Environment   `json:"environments"`
		Members      []models.ProjectMember `json:"members"`
	}

	json.NewEncoder(w).Encode(ProjectWithMembers{
		Project:      p,
		Environments: createdEnvs,
		Members: []models.ProjectMember{
			{
				ProjectID: p.ID,
				UserID:    userID,
				Role:      "admin",
				CreatedAt: p.CreatedAt, // Approximate
			},
		},
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
