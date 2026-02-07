package models

import "time"

type Environment struct {
	ID          int                 `json:"id"`
	ProjectID   int                 `json:"project_id"`
	Name        string              `json:"name"`
	Description *string             `json:"description"`
	APIKey      string              `json:"api_key"` // Keep APIKey for ingestion
	Settings    EnvironmentSettings `json:"settings"`
	IsActive    bool                `json:"is_active"`
	CreatedAt   time.Time           `json:"created_at"`
	UpdatedAt   *time.Time          `json:"updated_at"`
}

type EnvironmentSettings struct {
	Notifications NotificationSettings `json:"notifications"`
}
