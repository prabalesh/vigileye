package models

import "time"

type ErrorGroup struct {
	ID              int        `json:"id"`
	ProjectID       int        `json:"project_id"`
	EnvironmentID   int        `json:"environment_id"`
	Fingerprint     string     `json:"fingerprint"`
	Message         string     `json:"message"`
	Stack           *string    `json:"stack,omitempty"`
	URL             *string    `json:"url,omitempty"`
	Source          string     `json:"source"`
	Level           string     `json:"level"`
	FirstSeen       time.Time  `json:"first_seen"`
	LastSeen        time.Time  `json:"last_seen"`
	OccurrenceCount int        `json:"occurrence_count"`
	Status          string     `json:"status"`
	ResolvedAt      *time.Time `json:"resolved_at,omitempty"`
	ResolvedBy      *int       `json:"resolved_by,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}
