package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/prabalesh/vigileye/database"
	"github.com/prabalesh/vigileye/models"
)

// GetProjectMembers lists all members of a project
func GetProjectMembers(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])

	rows, err := database.DB.Query(`
		SELECT pm.user_id, u.email, u.name, pm.role, pm.created_at
		FROM project_members pm
		JOIN users u ON pm.user_id = u.id
		WHERE pm.project_id = $1
	`, projectID)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type MemberInfo struct {
		UserID    int       `json:"user_id"`
		Email     string    `json:"email"`
		Name      string    `json:"name"`
		Role      string    `json:"role"`
		CreatedAt time.Time `json:"created_at"` // Changed to time.Time
	}

	members := []MemberInfo{}
	for rows.Next() {
		var m MemberInfo
		if err := rows.Scan(&m.UserID, &m.Email, &m.Name, &m.Role, &m.CreatedAt); err != nil {
			continue
		}
		members = append(members, m)
	}

	json.NewEncoder(w).Encode(members)
}

// InviteMember adds a new member to the project
func InviteMember(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])

	var input struct {
		Email string `json:"email"`
		Role  string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if input.Role != "admin" && input.Role != "member" {
		http.Error(w, "Invalid role", http.StatusBadRequest)
		return
	}

	var userID int
	err := database.DB.QueryRow("SELECT id FROM users WHERE email = $1", input.Email).Scan(&userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	var exists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2)", projectID, userID).Scan(&exists)
	if err == nil && exists {
		http.Error(w, "Already a member", http.StatusConflict)
		return
	}

	var pm models.ProjectMember
	err = database.DB.QueryRow(`
		INSERT INTO project_members (project_id, user_id, role)
		VALUES ($1, $2, $3)
		RETURNING project_id, user_id, role, created_at
	`, projectID, userID, input.Role).Scan(&pm.ProjectID, &pm.UserID, &pm.Role, &pm.CreatedAt)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(pm)
}

// UpdateMemberRole updates a member's role
func UpdateMemberRole(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	targetUserID, _ := strconv.Atoi(vars["user_id"])

	var input struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if input.Role != "admin" && input.Role != "member" {
		http.Error(w, "Invalid role", http.StatusBadRequest)
		return
	}

	// Check if changing last admin to member
	var currentRole string
	err := database.DB.QueryRow("SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2", projectID, targetUserID).Scan(&currentRole)
	if err != nil {
		http.Error(w, "Member not found", http.StatusNotFound)
		return
	}

	if currentRole == "admin" && input.Role == "member" {
		var adminCount int
		err = database.DB.QueryRow("SELECT COUNT(*) FROM project_members WHERE project_id = $1 AND role = 'admin'", projectID).Scan(&adminCount)
		if err == nil && adminCount <= 1 {
			http.Error(w, "Cannot remove last admin", http.StatusForbidden)
			return
		}
	}

	var pm models.ProjectMember
	err = database.DB.QueryRow(`
		UPDATE project_members SET role = $1
		WHERE project_id = $2 AND user_id = $3
		RETURNING project_id, user_id, role, created_at
	`, input.Role, projectID, targetUserID).Scan(&pm.ProjectID, &pm.UserID, &pm.Role, &pm.CreatedAt)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(pm)
}

// RemoveMember removes a member from the project
func RemoveMember(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	targetUserID, _ := strconv.Atoi(vars["user_id"])

	// Check if removing last admin
	var role string
	err := database.DB.QueryRow("SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2", projectID, targetUserID).Scan(&role)
	if err != nil {
		http.Error(w, "Member not found", http.StatusNotFound)
		return
	}

	if role == "admin" {
		var adminCount int
		err = database.DB.QueryRow("SELECT COUNT(*) FROM project_members WHERE project_id = $1 AND role = 'admin'", projectID).Scan(&adminCount)
		if err == nil && adminCount <= 1 {
			http.Error(w, "Cannot remove last admin", http.StatusForbidden)
			return
		}
	}

	_, err = database.DB.Exec("DELETE FROM project_members WHERE project_id = $1 AND user_id = $2", projectID, targetUserID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// CheckLastAdmin checks if a user is the last admin of a project
func CheckLastAdmin(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	targetUserID, _ := strconv.Atoi(vars["user_id"])

	var adminCount int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM project_members WHERE project_id = $1 AND role = 'admin'", projectID).Scan(&adminCount)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	var role string
	err = database.DB.QueryRow("SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2", projectID, targetUserID).Scan(&role)

	isLastAdmin := (adminCount == 1 && role == "admin")

	json.NewEncoder(w).Encode(map[string]bool{"is_last_admin": isLastAdmin})
}
