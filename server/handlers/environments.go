package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/prabalesh/vigileye/database"
	"github.com/prabalesh/vigileye/middleware"
	"github.com/prabalesh/vigileye/models"
)

func GetEnvironments(w http.ResponseWriter, r *http.Request) {
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

	rows, err := database.DB.Query(`
		SELECT id, project_id, name, description, api_key, settings, is_active, created_at, updated_at 
		FROM environments WHERE project_id = $1 ORDER BY created_at ASC
	`, projectID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	envs := []models.Environment{}
	for rows.Next() {
		var e models.Environment
		var settingsJSON []byte
		if err := rows.Scan(&e.ID, &e.ProjectID, &e.Name, &e.Description, &e.APIKey, &settingsJSON, &e.IsActive, &e.CreatedAt, &e.UpdatedAt); err != nil {
			continue
		}
		if len(settingsJSON) > 0 {
			json.Unmarshal(settingsJSON, &e.Settings)
		}
		envs = append(envs, e)
	}

	json.NewEncoder(w).Encode(envs)
}

func GetEnvironment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	envID, _ := strconv.Atoi(vars["env_id"])

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

	var e models.Environment
	var settingsJSON []byte
	err = database.DB.QueryRow(`
		SELECT id, project_id, name, description, api_key, settings, is_active, created_at, updated_at 
		FROM environments WHERE id = $1 AND project_id = $2
	`, envID, projectID).Scan(&e.ID, &e.ProjectID, &e.Name, &e.Description, &e.APIKey, &settingsJSON, &e.IsActive, &e.CreatedAt, &e.UpdatedAt)

	if err != nil {
		http.Error(w, "Environment not found", http.StatusNotFound)
		return
	}

	if len(settingsJSON) > 0 {
		json.Unmarshal(settingsJSON, &e.Settings)
	}

	json.NewEncoder(w).Encode(e)
}

func CreateEnvironment(w http.ResponseWriter, r *http.Request) {
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

	var input struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Validate name
	validName := regexp.MustCompile(`^[a-z0-9-]+$`)
	if !validName.MatchString(input.Name) || len(input.Name) > 50 {
		http.Error(w, "Invalid name: lowercase alphanumeric and hyphens only, max 50 chars", http.StatusBadRequest)
		return
	}

	var e models.Environment
	var settingsJSON []byte
	err = database.DB.QueryRow(`
		INSERT INTO environments (project_id, name) 
		VALUES ($1, $2) 
		RETURNING id, project_id, name, description, api_key, settings, is_active, created_at, updated_at
	`, projectID, input.Name).Scan(&e.ID, &e.ProjectID, &e.Name, &e.Description, &e.APIKey, &settingsJSON, &e.IsActive, &e.CreatedAt, &e.UpdatedAt)

	if err != nil {
		http.Error(w, "Database error or environment already exists", http.StatusInternalServerError)
		return
	}

	if len(settingsJSON) > 0 {
		json.Unmarshal(settingsJSON, &e.Settings)
	}

	json.NewEncoder(w).Encode(e)
}

func sendJSONError(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"message": message})
}

func UpdateEnvironment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	envID, _ := strconv.Atoi(vars["env_id"])

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

	bodyBytes, _ := io.ReadAll(r.Body)
	log.Printf("[UpdateEnvironment] Raw body: %s", string(bodyBytes))
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var input struct {
		Name     *string          `json:"name"`
		IsActive *bool            `json:"is_active"`
		Settings *json.RawMessage `json:"settings"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		log.Printf("[UpdateEnvironment] Decode error: %v", err)
		sendJSONError(w, fmt.Sprintf("Invalid input: %v", err), http.StatusBadRequest)
		return
	}

	query := "UPDATE environments SET updated_at = NOW()"
	args := []interface{}{}
	argIdx := 1

	if input.Name != nil {
		// Validate name
		validName := regexp.MustCompile(`^[a-z0-9-]+$`)
		if !validName.MatchString(*input.Name) || len(*input.Name) > 50 {
			sendJSONError(w, "Invalid name: lowercase alphanumeric and hyphens only, max 50 chars", http.StatusBadRequest)
			return
		}
		query += fmt.Sprintf(", name = $%d", argIdx)
		args = append(args, *input.Name)
		argIdx++
	}

	if input.IsActive != nil {
		query += fmt.Sprintf(", is_active = $%d", argIdx)
		args = append(args, *input.IsActive)
		argIdx++
	}
	if input.Settings != nil {
		// Validate settings structure
		var dummy models.EnvironmentSettings
		if err := json.Unmarshal([]byte(*input.Settings), &dummy); err != nil {
			log.Printf("[UpdateEnvironment] Settings validation error: %v", err)
			sendJSONError(w, fmt.Sprintf("Invalid settings structure: %v", err), http.StatusBadRequest)
			return
		}

		settingsJSON, _ := json.Marshal(input.Settings)
		query += fmt.Sprintf(", settings = $%d", argIdx)
		args = append(args, settingsJSON)
		argIdx++
	}

	query += fmt.Sprintf(" WHERE id = $%d AND project_id = $%d RETURNING id, project_id, name, description, api_key, settings, is_active, created_at, updated_at", argIdx, argIdx+1)
	args = append(args, envID, projectID)

	var e models.Environment
	var settingsJSON []byte
	err = database.DB.QueryRow(query, args...).Scan(&e.ID, &e.ProjectID, &e.Name, &e.Description, &e.APIKey, &settingsJSON, &e.IsActive, &e.CreatedAt, &e.UpdatedAt)

	if err != nil {
		log.Printf("[UpdateEnvironment] DB Error: %v", err)
		sendJSONError(w, "Environment not found or update failed", http.StatusNotFound)
		return
	}

	if len(settingsJSON) > 0 {
		json.Unmarshal(settingsJSON, &e.Settings)
	}

	json.NewEncoder(w).Encode(e)
}

func DeleteEnvironment(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	envID, _ := strconv.Atoi(vars["env_id"])

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

	// Check if it's the last environment
	var count int
	err = database.DB.QueryRow("SELECT COUNT(*) FROM environments WHERE project_id = $1", projectID).Scan(&count)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if count <= 1 {
		http.Error(w, "Cannot delete only environment", http.StatusConflict)
		return
	}

	_, err = database.DB.Exec("DELETE FROM environments WHERE id = $1 AND project_id = $2", envID, projectID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func RegenerateEnvironmentKey(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	envID, _ := strconv.Atoi(vars["env_id"])

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

	var apiKey string
	err = database.DB.QueryRow(`
		UPDATE environments SET api_key = gen_random_uuid() 
		WHERE id = $1 AND project_id = $2 
		RETURNING api_key
	`, envID, projectID).Scan(&apiKey)

	if err != nil {
		http.Error(w, "Environment not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"api_key": apiKey})
}
