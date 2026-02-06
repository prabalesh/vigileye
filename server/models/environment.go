package models

import "time"

type Environment struct {
	ID        int       `json:"id"`
	ProjectID int       `json:"project_id"`
	Name      string    `json:"name"`
	APIKey    string    `json:"api_key"`
	Settings  string    `json:"settings"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}
