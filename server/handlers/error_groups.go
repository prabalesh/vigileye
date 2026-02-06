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

func GetErrorGroups(w http.ResponseWriter, r *http.Request) {
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
	envID := query.Get("environment_id")
	status := query.Get("status")
	limit, _ := strconv.Atoi(query.Get("limit"))
	if limit == 0 {
		limit = 50
	}
	offset, _ := strconv.Atoi(query.Get("offset"))

	sqlQuery := `
		SELECT eg.id, eg.project_id, eg.environment_id, eg.fingerprint, eg.message, 
		       eg.stack, eg.url, eg.source, eg.level, eg.first_seen, eg.last_seen, 
		       eg.occurrence_count, eg.status, eg.resolved_at, eg.resolved_by, 
		       eg.created_at, e.name as environment_name
		FROM error_groups eg
		JOIN environments e ON eg.environment_id = e.id
		WHERE eg.project_id = $1`

	args := []interface{}{projectID}
	argIdx := 2

	if envID != "" {
		sqlQuery += " AND eg.environment_id = $" + strconv.Itoa(argIdx)
		args = append(args, envID)
		argIdx++
	}
	if status != "" {
		sqlQuery += " AND eg.status = $" + strconv.Itoa(argIdx)
		args = append(args, status)
		argIdx++
	}

	sqlQuery += " ORDER BY eg.last_seen DESC LIMIT $" + strconv.Itoa(argIdx) + " OFFSET $" + strconv.Itoa(argIdx+1)
	args = append(args, limit, offset)

	rows, err := database.DB.Query(sqlQuery, args...)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type GroupWithEnv struct {
		models.ErrorGroup
		EnvironmentName string `json:"environmentName"`
	}

	groups := []GroupWithEnv{}
	for rows.Next() {
		var g GroupWithEnv
		err := rows.Scan(
			&g.ID, &g.ProjectID, &g.EnvironmentID, &g.Fingerprint, &g.Message,
			&g.Stack, &g.URL, &g.Source, &g.Level, &g.FirstSeen, &g.LastSeen,
			&g.OccurrenceCount, &g.Status, &g.ResolvedAt, &g.ResolvedBy,
			&g.CreatedAt, &g.EnvironmentName,
		)
		if err != nil {
			continue
		}
		groups = append(groups, g)
	}

	json.NewEncoder(w).Encode(groups)
}

func GetErrorGroupDetail(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	groupID, _ := strconv.Atoi(vars["group_id"])

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

	var g models.ErrorGroup
	err = database.DB.QueryRow(`
		SELECT id, project_id, environment_id, fingerprint, message, stack, url, 
		       source, level, first_seen, last_seen, occurrence_count, status, 
		       resolved_at, resolved_by, created_at
		FROM error_groups WHERE id = $1 AND project_id = $2
	`, groupID, projectID).Scan(
		&g.ID, &g.ProjectID, &g.EnvironmentID, &g.Fingerprint, &g.Message,
		&g.Stack, &g.URL, &g.Source, &g.Level, &g.FirstSeen, &g.LastSeen,
		&g.OccurrenceCount, &g.Status, &g.ResolvedAt, &g.ResolvedBy, &g.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Error group not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(g)
}

func GetErrorGroupOccurrences(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	groupID, _ := strconv.Atoi(vars["group_id"])

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
	limit, _ := strconv.Atoi(query.Get("limit"))
	if limit == 0 {
		limit = 50
	}
	offset, _ := strconv.Atoi(query.Get("offset"))

	rows, err := database.DB.Query(`
		SELECT id, project_id, environment_id, error_group_id, timestamp, source, 
		       level, message, stack, url, method, user_agent, user_id, 
		       status_code, extra_data, resolved, created_at 
		FROM error_logs 
		WHERE error_group_id = $1 AND project_id = $2 
		ORDER BY created_at DESC LIMIT $3 OFFSET $4
	`, groupID, projectID, limit, offset)

	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	logs := []models.ErrorLog{}
	for rows.Next() {
		var l models.ErrorLog
		err := rows.Scan(
			&l.ID, &l.ProjectID, &l.EnvironmentID, &l.ErrorGroupID, &l.Timestamp,
			&l.Source, &l.Level, &l.Message, &l.Stack, &l.URL, &l.Method,
			&l.UserAgent, &l.UserID, &l.StatusCode, &l.ExtraData, &l.Resolved, &l.CreatedAt,
		)
		if err != nil {
			continue
		}
		logs = append(logs, l)
	}

	json.NewEncoder(w).Encode(logs)
}

func ResolveErrorGroup(w http.ResponseWriter, r *http.Request) {
	updateGroupStatus(w, r, "resolved")
}

func IgnoreErrorGroup(w http.ResponseWriter, r *http.Request) {
	updateGroupStatus(w, r, "ignored")
}

func ReopenErrorGroup(w http.ResponseWriter, r *http.Request) {
	updateGroupStatus(w, r, "unresolved")
}

func updateGroupStatus(w http.ResponseWriter, r *http.Request, status string) {
	userID := r.Context().Value(middleware.UserIDKey).(int)
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	groupID, _ := strconv.Atoi(vars["group_id"])

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

	var query string
	var args []interface{}

	if status == "resolved" {
		query = "UPDATE error_groups SET status = $1, resolved_at = NOW(), resolved_by = $2 WHERE id = $3 AND project_id = $4 RETURNING id"
		args = append(args, status, userID, groupID, projectID)
	} else if status == "ignored" {
		query = "UPDATE error_groups SET status = $1, resolved_at = NULL, resolved_by = NULL WHERE id = $2 AND project_id = $3 RETURNING id"
		args = append(args, status, groupID, projectID)
	} else { // unresolved
		query = "UPDATE error_groups SET status = $1, resolved_at = NULL, resolved_by = NULL WHERE id = $2 AND project_id = $3 RETURNING id"
		args = append(args, status, groupID, projectID)
	}

	var id int
	err = database.DB.QueryRow(query, args...).Scan(&id)
	if err != nil {
		http.Error(w, "Error group not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}
