package services

import (
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/prabalesh/vigileye/models"
)

type NotificationService struct {
	db              *sql.DB
	telegramService *TelegramService
	baseURL         string
}

func NewNotificationService(db *sql.DB, baseURL string) *NotificationService {
	return &NotificationService{
		db:              db,
		telegramService: NewTelegramService(),
		baseURL:         baseURL,
	}
}

// ShouldNotify determines if a notification should be sent
func (s *NotificationService) ShouldNotify(errorGroup *models.ErrorGroup, settings *models.NotificationSettings) bool {
	if settings == nil || !settings.Telegram.Enabled {
		return false
	}

	triggers := settings.Telegram.Triggers

	// New error (first occurrence)
	if triggers.NewError && errorGroup.OccurrenceCount == 1 {
		return true
	}

	// Threshold reached
	if triggers.Threshold.Enabled {
		if s.hasReachedThreshold(errorGroup, triggers.Threshold) {
			return true
		}
	}

	// Ignored error spike
	if triggers.SpikeOnIgnored && errorGroup.Status == "ignored" {
		if s.hasSpike(errorGroup) {
			return true
		}
	}

	return false
}

// SendNotification sends notification based on error group status
func (s *NotificationService) SendNotification(
	errorGroup *models.ErrorGroup,
	environment *models.Environment,
	settings *models.NotificationSettings,
) error {
	// Check debounce (don't spam)
	if !s.canSendNotification(errorGroup) {
		log.Printf("[Notification] Debounced: error_group_id=%d", errorGroup.ID)
		return nil
	}

	// Prepare notification data
	data := &ErrorNotificationData{
		Message:         errorGroup.Message,
		Environment:     environment.Name,
		Level:           errorGroup.Level,
		OccurrenceCount: errorGroup.OccurrenceCount,
		FirstSeen:       errorGroup.FirstSeen,
		StackPreview:    s.getStackPreview(errorGroup.Stack, 3),
		ViewURL:         fmt.Sprintf("%s/projects/%d/error-groups/%d", s.baseURL, errorGroup.ProjectID, errorGroup.ID),
	}

	// Send appropriate notification type
	var err error
	if errorGroup.Status == "ignored" && s.hasSpike(errorGroup) {
		err = s.telegramService.SendSpikeAlert(
			settings.Telegram.BotToken,
			settings.Telegram.ChatID,
			data,
		)
	} else {
		err = s.telegramService.SendErrorNotification(
			settings.Telegram.BotToken,
			settings.Telegram.ChatID,
			data,
		)
	}

	if err != nil {
		log.Printf("[Notification] Failed: %v", err)
		return err
	}

	// Update notification tracking
	s.updateNotificationTracking(errorGroup.ID)

	log.Printf("[Notification] Sent successfully: error_group_id=%d", errorGroup.ID)
	return nil
}

func (s *NotificationService) hasReachedThreshold(errorGroup *models.ErrorGroup, threshold models.ThresholdTrigger) bool {
	windowStart := time.Now().Add(-time.Duration(threshold.GetWindowMinutes()) * time.Minute)

	var recentCount int
	err := s.db.QueryRow(`
		SELECT COUNT(*) FROM error_logs
		WHERE error_group_id = $1 AND created_at >= $2
	`, errorGroup.ID, windowStart).Scan(&recentCount)

	if err != nil {
		log.Printf("[Notification] Error checking threshold: %v", err)
		return false
	}

	return recentCount >= threshold.GetCount()
}

func (s *NotificationService) hasSpike(errorGroup *models.ErrorGroup) bool {
	var last5Min, lastHour int

	s.db.QueryRow(`
		SELECT COUNT(*) FROM error_logs
		WHERE error_group_id = $1 AND created_at >= NOW() - INTERVAL '5 minutes'
	`, errorGroup.ID).Scan(&last5Min)

	s.db.QueryRow(`
		SELECT COUNT(*) FROM error_logs
		WHERE error_group_id = $1 AND created_at >= NOW() - INTERVAL '1 hour'
	`, errorGroup.ID).Scan(&lastHour)

	if lastHour == 0 {
		return false
	}

	avgPerMinute := float64(lastHour) / 60.0
	currentPerMinute := float64(last5Min) / 5.0

	return currentPerMinute > (avgPerMinute * 100)
}

func (s *NotificationService) canSendNotification(errorGroup *models.ErrorGroup) bool {
	if errorGroup.LastNotifiedAt != nil {
		elapsed := time.Since(*errorGroup.LastNotifiedAt)
		if elapsed < 1*time.Minute {
			return false
		}
	}
	return true
}

func (s *NotificationService) updateNotificationTracking(errorGroupID int) {
	_, err := s.db.Exec(`
		UPDATE error_groups
		SET last_notified_at = NOW(), notification_count = notification_count + 1
		WHERE id = $1
	`, errorGroupID)

	if err != nil {
		log.Printf("[Notification] Error updating tracking: %v", err)
	}
}

func (s *NotificationService) getStackPreview(stack *string, lines int) string {
	if stack == nil || *stack == "" {
		return ""
	}

	stackLines := strings.Split(*stack, "\n")
	if len(stackLines) > lines {
		stackLines = stackLines[:lines]
	}

	return strings.Join(stackLines, "\n")
}
