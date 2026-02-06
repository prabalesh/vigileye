package models

import "time"

type Environment struct {
	ID        int       `json:"id"`
	ProjectID int       `json:"projectId"`
	Name      string    `json:"name"`
	APIKey    string    `json:"apiKey"`
	Settings  string    `json:"settings"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
}
