package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type TelegramService struct {
	client *http.Client
}

func NewTelegramService() *TelegramService {
	return &TelegramService{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// TestNotification sends a test message to verify bot setup
func (s *TelegramService) TestNotification(botToken, chatID string) error {
	message := "🔔 *Test Notification from Vigil Eye*\n\n" +
		"Your Telegram notifications are configured correctly!\n\n" +
		"You will receive alerts when:\n" +
		"• New unique errors occur\n" +
		"• Error thresholds are reached\n" +
		"• Ignored errors spike unexpectedly\n\n" +
		"✅ Setup complete!"

	return s.sendMessage(botToken, chatID, message)
}

// SendErrorNotification sends error alert to Telegram
func (s *TelegramService) SendErrorNotification(botToken, chatID string, data *ErrorNotificationData) error {
	message := s.formatErrorMessage(data)
	return s.sendMessage(botToken, chatID, message)
}

// SendSpikeAlert sends alert for ignored error that's spiking
func (s *TelegramService) SendSpikeAlert(botToken, chatID string, data *ErrorNotificationData) error {
	message := fmt.Sprintf(
		"⚠️ *IGNORED ERROR SPIKE* in %s\n\n"+
			"An ignored error is suddenly spiking!\n\n"+
			"*Error:* %s\n"+
			"*Environment:* %s\n"+
			"*Occurrences:* %d (100x higher than normal)\n"+
			"*Status:* Previously ignored\n\n"+
			"This might indicate a new issue. Consider investigating.\n\n"+
			"[View Details](%s)",
		data.Environment,
		escapeMarkdown(data.Message),
		data.Environment,
		data.OccurrenceCount,
		data.ViewURL,
	)

	return s.sendMessage(botToken, chatID, message)
}

func (s *TelegramService) formatErrorMessage(data *ErrorNotificationData) string {
	emoji := "🔴"
	status := "NEW"

	if data.Level == "warn" {
		emoji = "🟡"
	}

	if data.OccurrenceCount > 1 {
		status = "RECURRING"
	}

	message := fmt.Sprintf(
		"%s *%s ERROR* in %s\n\n"+
			"*Message:* %s\n"+
			"*Environment:* %s\n"+
			"*Level:* %s\n"+
			"*Occurrences:* %d\n"+
			"*First Seen:* %s\n"+
			"*Status:* Unresolved\n\n",
		emoji,
		status,
		data.Environment,
		escapeMarkdown(data.Message),
		data.Environment,
		data.Level,
		data.OccurrenceCount,
		data.FirstSeen.Format("Jan 2, 3:04 PM"),
	)

	// Add stack trace preview (first 3 lines)
	if data.StackPreview != "" {
		lines := strings.Split(data.StackPreview, "\n")
		previewLines := lines
		if len(lines) > 3 {
			previewLines = lines[:3]
		}

		message += "*Stack Trace:*\n```\n"
		message += strings.Join(previewLines, "\n")
		if len(lines) > 3 {
			message += "\n... (view full stack in dashboard)"
		}
		message += "\n```\n\n"
	}

	// Add link to view full details
	message += fmt.Sprintf("[View Full Details](%s)", data.ViewURL)

	return message
}

func (s *TelegramService) sendMessage(botToken, chatID, text string) error {
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", botToken)

	payload := map[string]interface{}{
		"chat_id":    chatID,
		"text":       text,
		"parse_mode": "Markdown",
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	resp, err := s.client.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		var errorResp map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errorResp)

		// Handle common errors with user-friendly messages
		if description, ok := errorResp["description"].(string); ok {
			if strings.Contains(description, "bot was blocked") {
				return fmt.Errorf("bot was blocked by user or removed from group")
			}
			if strings.Contains(description, "chat not found") {
				return fmt.Errorf("invalid chat ID or bot not in group")
			}
			if strings.Contains(description, "Unauthorized") {
				return fmt.Errorf("invalid bot token")
			}
			return fmt.Errorf("telegram API error: %s", description)
		}

		return fmt.Errorf("telegram API error: status %d", resp.StatusCode)
	}

	return nil
}

// escapeMarkdown escapes special Markdown characters
func escapeMarkdown(text string) string {
	replacer := strings.NewReplacer(
		"_", "\\_",
		"*", "\\*",
		"[", "\\[",
		"]", "\\]",
		"(", "\\(",
		")", "\\)",
		"~", "\\~",
		"`", "\\`",
		">", "\\>",
		"#", "\\#",
		"+", "\\+",
		"-", "\\-",
		"=", "\\=",
		"|", "\\|",
		"{", "\\{",
		"}", "\\}",
		".", "\\.",
		"!", "\\!",
	)
	return replacer.Replace(text)
}

type ErrorNotificationData struct {
	Message         string
	Environment     string
	Level           string
	OccurrenceCount int
	FirstSeen       time.Time
	StackPreview    string
	ViewURL         string
}
