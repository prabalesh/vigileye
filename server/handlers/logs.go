package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/prabalesh/vigileye/database"
	"github.com/prabalesh/vigileye/middleware"
	"github.com/prabalesh/vigileye/models"
	"github.com/prabalesh/vigileye/utils"
)

func LogError(w http.ResponseWriter, r *http.Request) {
	projectID, ok := r.Context().Value(middleware.ProjectIDKey).(int)
	if !ok {
		http.Error(w, "Project ID not found in context", http.StatusInternalServerError)
		return
	}
	environmentID, ok := r.Context().Value(middleware.EnvironmentIDKey).(int)
	if !ok {
		http.Error(w, "Environment ID not found in context", http.StatusInternalServerError)
		return
	}

	var input models.ErrorLog
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if input.Timestamp.IsZero() {
		input.Timestamp = time.Now()
	}

	// Generate fingerprint
	stackStr := ""
	if input.Stack != nil {
		stackStr = *input.Stack
	}
	urlStr := ""
	if input.URL != nil {
		urlStr = *input.URL
	}
	fingerprint := utils.GenerateErrorFingerprint(input.Message, stackStr, urlStr)

	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Find or create error group
	var groupID int
	err = tx.QueryRow(`
		SELECT id FROM error_groups 
		WHERE fingerprint = $1 AND project_id = $2 AND environment_id = $3
	`, fingerprint, projectID, environmentID).Scan(&groupID)

	if err != nil {
		err = tx.QueryRow(`
			INSERT INTO error_groups (
				project_id, environment_id, fingerprint, message, stack, url, 
				source, level, first_seen, last_seen, occurrence_count, status
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, 1, 'unresolved')
			RETURNING id
		`, projectID, environmentID, fingerprint, input.Message, input.Stack, input.URL,
			input.Source, input.Level, input.Timestamp).Scan(&groupID)

		if err != nil {
			fmt.Printf("Error creating error group: %v\n", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
	} else {
		// Update existing group and auto-reopen if resolved/ignored
		_, err = tx.Exec(`
			UPDATE error_groups 
			SET last_seen = $1, occurrence_count = occurrence_count + 1, status = 'unresolved', 
			    resolved_at = NULL, resolved_by = NULL
			WHERE id = $2
		`, input.Timestamp, groupID)

		if err != nil {
			fmt.Printf("Error updating error group: %v\n", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
	}

	_, err = tx.Exec(`
		INSERT INTO error_logs (
			project_id, environment_id, error_group_id, timestamp, source, level, message, 
			stack, url, method, user_agent, user_id, status_code, extra_data
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`, projectID, environmentID, groupID, input.Timestamp, input.Source, input.Level, input.Message,
		input.Stack, input.URL, input.Method, input.UserAgent, input.UserID, input.StatusCode, input.ExtraData)

	if err != nil {
		fmt.Printf("Error logging to DB: %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func GetErrors(w http.ResponseWriter, r *http.Request) {
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

	query := r.URL.Query()
	level := query.Get("level")
	source := query.Get("source")
	envID := query.Get("environment_id")
	groupID := query.Get("error_group_id")
	limit, _ := strconv.Atoi(query.Get("limit"))
	if limit == 0 {
		limit = 100
	}
	offset, _ := strconv.Atoi(query.Get("offset"))

	sqlQuery := `SELECT id, project_id, environment_id, error_group_id, timestamp, source, level, message, stack, url, method, user_agent, user_id, status_code, extra_data, resolved, created_at 
	             FROM error_logs WHERE project_id = $1`
	args := []interface{}{projectID}
	argIdx := 2

	if level != "" {
		sqlQuery += " AND level = $" + strconv.Itoa(argIdx)
		args = append(args, level)
		argIdx++
	}
	if source != "" {
		sqlQuery += " AND source = $" + strconv.Itoa(argIdx)
		args = append(args, source)
		argIdx++
	}
	if envID != "" {
		envIDInt, _ := strconv.Atoi(envID)
		sqlQuery += " AND environment_id = $" + strconv.Itoa(argIdx)
		args = append(args, envIDInt)
		argIdx++
	}
	if groupID != "" {
		groupIDInt, _ := strconv.Atoi(groupID)
		sqlQuery += " AND error_group_id = $" + strconv.Itoa(argIdx)
		args = append(args, groupIDInt)
		argIdx++
	}

	sqlQuery += " ORDER BY created_at DESC LIMIT $" + strconv.Itoa(argIdx) + " OFFSET $" + strconv.Itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := database.DB.Query(sqlQuery, args...)
	if err != nil {
		fmt.Printf("Query error: %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	logs := []models.ErrorLog{}
	for rows.Next() {
		var l models.ErrorLog
		err := rows.Scan(
			&l.ID, &l.ProjectID, &l.EnvironmentID, &l.ErrorGroupID, &l.Timestamp, &l.Source, &l.Level, &l.Message,
			&l.Stack, &l.URL, &l.Method, &l.UserAgent, &l.UserID, &l.StatusCode,
			&l.ExtraData, &l.Resolved, &l.CreatedAt,
		)
		if err != nil {
			fmt.Printf("Scan error: %v\n", err)
			continue
		}
		logs = append(logs, l)
	}

	json.NewEncoder(w).Encode(logs)
}

func GetErrorDetail(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	errorID, _ := strconv.Atoi(vars["error_id"])

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

	var l models.ErrorLog
	err = database.DB.QueryRow(`
		SELECT id, project_id, environment_id, error_group_id, timestamp, source, level, message, stack, url, method, user_agent, user_id, status_code, extra_data, resolved, created_at 
		FROM error_logs WHERE id = $1 AND project_id = $2
	`, errorID, projectID).Scan(
		&l.ID, &l.ProjectID, &l.EnvironmentID, &l.ErrorGroupID, &l.Timestamp, &l.Source, &l.Level, &l.Message,
		&l.Stack, &l.URL, &l.Method, &l.UserAgent, &l.UserID, &l.StatusCode,
		&l.ExtraData, &l.Resolved, &l.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Error not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(l)
}

func ResolveError(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	errorID, _ := strconv.Atoi(vars["error_id"])

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
		Resolved bool `json:"resolved"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err = database.DB.Exec("UPDATE error_logs SET resolved = $1 WHERE id = $2 AND project_id = $3", input.Resolved, errorID, projectID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}
