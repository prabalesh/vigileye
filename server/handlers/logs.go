package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/vigileye/vigileye/database"
	"github.com/vigileye/vigileye/middleware"
	"github.com/vigileye/vigileye/models"
)

func LogError(w http.ResponseWriter, r *http.Request) {
	projectID := r.Context().Value(middleware.ProjectIDKey).(int)

	var input models.ErrorLog
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if input.Timestamp.IsZero() {
		input.Timestamp = time.Now()
	}

	_, err := database.DB.Exec(`
		INSERT INTO error_logs (
			project_id, timestamp, source, level, message, stack, url, method, 
			user_agent, user_id, status_code, extra_data
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`, projectID, input.Timestamp, input.Source, input.Level, input.Message, input.Stack,
		input.URL, input.Method, input.UserAgent, input.UserID, input.StatusCode, input.ExtraData)

	if err != nil {
		fmt.Printf("Error logging to DB: %v\n", err)
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
	limit, _ := strconv.Atoi(query.Get("limit"))
	if limit == 0 {
		limit = 100
	}
	offset, _ := strconv.Atoi(query.Get("offset"))

	sqlQuery := `SELECT id, project_id, timestamp, source, level, message, stack, url, method, user_agent, user_id, status_code, extra_data, resolved, created_at 
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

	sqlQuery += " ORDER BY created_at DESC LIMIT $" + strconv.Itoa(argIdx) + " OFFSET $" + strconv.Itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := database.DB.Query(sqlQuery, args...)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	logs := []models.ErrorLog{}
	for rows.Next() {
		var l models.ErrorLog
		err := rows.Scan(
			&l.ID, &l.ProjectID, &l.Timestamp, &l.Source, &l.Level, &l.Message,
			&l.Stack, &l.URL, &l.Method, &l.UserAgent, &l.UserID, &l.StatusCode,
			&l.ExtraData, &l.Resolved, &l.CreatedAt,
		)
		if err != nil {
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
		SELECT id, project_id, timestamp, source, level, message, stack, url, method, user_agent, user_id, status_code, extra_data, resolved, created_at 
		FROM error_logs WHERE id = $1 AND project_id = $2
	`, errorID, projectID).Scan(
		&l.ID, &l.ProjectID, &l.Timestamp, &l.Source, &l.Level, &l.Message,
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
