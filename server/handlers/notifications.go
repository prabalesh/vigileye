package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/prabalesh/vigileye/middleware"
	"github.com/prabalesh/vigileye/models"
	"github.com/prabalesh/vigileye/services"

	"github.com/gorilla/mux"
)

type NotificationHandler struct {
	db              *sql.DB
	telegramService *services.TelegramService
}

func NewNotificationHandler(db *sql.DB) *NotificationHandler {
	return &NotificationHandler{
		db:              db,
		telegramService: services.NewTelegramService(),
	}
}

// TestTelegramNotification sends a test notification
func (h *NotificationHandler) TestTelegramNotification(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	envID, _ := strconv.Atoi(vars["env_id"])

	// Get current user from context
	userID := r.Context().Value(middleware.UserIDKey).(int)

	// Check if user is admin
	if !h.isUserAdmin(projectID, userID) {
		sendJSONError(w, "Admin access required", http.StatusForbidden)
		return
	}

	// Get environment settings
	var settingsJSON []byte
	err := h.db.QueryRow(`
        SELECT settings FROM environments WHERE id = $1 AND project_id = $2
    `, envID, projectID).Scan(&settingsJSON)

	if err != nil {
		sendJSONError(w, "Environment not found", http.StatusNotFound)
		return
	}

	var envSettings models.EnvironmentSettings
	if len(settingsJSON) > 0 {
		log.Printf("[Test Notification] Raw settings from DB: %s", string(settingsJSON))
		if err := json.Unmarshal(settingsJSON, &envSettings); err != nil {
			log.Printf("[Test Notification] Unmarshal error: %v", err)
			sendJSONError(w, "Invalid settings format", http.StatusInternalServerError)
			return
		}
	} else {
		log.Printf("[Test Notification] No settings found in DB")
	}

	telegram := envSettings.Notifications.Telegram
	log.Printf("[Test Notification] Extracted config: enabled=%v, bot_token_len=%d, chat_id=%s",
		telegram.Enabled, len(telegram.BotToken), telegram.ChatID)

	if !telegram.Enabled || telegram.BotToken == "" || telegram.ChatID == "" {
		sendJSONError(w, "Telegram notifications not configured or enabled. Please save your settings first.", http.StatusBadRequest)
		return
	}

	// Send test notification
	err = h.telegramService.TestNotification(telegram.BotToken, telegram.ChatID)

	if err != nil {
		log.Printf("[Test Notification] Error: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Test notification sent successfully! Check your Telegram group.",
	})
}

// GetNotificationHistory returns a list of error groups that have been notified
func (h *NotificationHandler) GetNotificationHistory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	projectID, _ := strconv.Atoi(vars["id"])
	envID, _ := strconv.Atoi(vars["env_id"])

	userID := r.Context().Value(middleware.UserIDKey).(int)
	if !h.isUserAdmin(projectID, userID) {
		sendJSONError(w, "Admin access required", http.StatusForbidden)
		return
	}

	rows, err := h.db.Query(`
		SELECT id, message, level, notification_count, last_notified_at, occurrence_count
		FROM error_groups
		WHERE project_id = $1 AND environment_id = $2 AND notification_count > 0
		ORDER BY last_notified_at DESC
		LIMIT 50
	`, projectID, envID)

	if err != nil {
		log.Printf("[Notification History] Error: %v", err)
		sendJSONError(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	history := []map[string]interface{}{}
	for rows.Next() {
		var id, notifCount, occurCount int
		var message, level string
		var lastNotified sql.NullTime

		err := rows.Scan(&id, &message, &level, &notifCount, &lastNotified, &occurCount)
		if err != nil {
			continue
		}

		item := map[string]interface{}{
			"error_group_id":     id,
			"message":            message,
			"level":              level,
			"notification_count": notifCount,
			"occurrence_count":   occurCount,
		}

		if lastNotified.Valid {
			item["last_notified_at"] = lastNotified.Time
		}

		history = append(history, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}

func (h *NotificationHandler) isUserAdmin(projectID, userID int) bool {
	var role string
	err := h.db.QueryRow(`
        SELECT role FROM project_members
        WHERE project_id = $1 AND user_id = $2
        UNION
        SELECT 'admin' as role FROM projects
        WHERE id = $1 AND owner_id = $2
    `, projectID, userID).Scan(&role)

	return err == nil && (role == "admin" || role == "owner")
}
