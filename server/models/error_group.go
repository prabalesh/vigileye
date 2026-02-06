package models

import "time"

type ErrorGroup struct {
	ID              int        `json:"id"`
	ProjectID       int        `json:"projectId"`
	EnvironmentID   int        `json:"environmentId"`
	Fingerprint     string     `json:"fingerprint"`
	Message         string     `json:"message"`
	Stack           *string    `json:"stack,omitempty"`
	URL             *string    `json:"url,omitempty"`
	Source          string     `json:"source"`
	Level           string     `json:"level"`
	FirstSeen       time.Time  `json:"firstSeen"`
	LastSeen        time.Time  `json:"lastSeen"`
	OccurrenceCount int        `json:"occurrenceCount"`
	Status          string     `json:"status"`
	ResolvedAt      *time.Time `json:"resolvedAt,omitempty"`
	ResolvedBy      *int       `json:"resolvedBy,omitempty"`
	CreatedAt       time.Time  `json:"createdAt"`
}
