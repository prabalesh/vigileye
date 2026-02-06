package models

import (
	"encoding/json"
	"time"
)

type ErrorLog struct {
	ID            int              `json:"id"`
	ProjectID     int              `json:"project_id"`
	EnvironmentID int              `json:"environment_id"`
	ErrorGroupID  int              `json:"error_group_id"`
	Timestamp     time.Time        `json:"timestamp"`
	Source        string           `json:"source"`
	Level         string           `json:"level"`
	Message       string           `json:"message"`
	Stack         *string          `json:"stack"`
	URL           *string          `json:"url"`
	Method        *string          `json:"method"`
	UserAgent     *string          `json:"user_agent"`
	UserID        *string          `json:"user_id"`
	StatusCode    *int             `json:"status_code"`
	ExtraData     *json.RawMessage `json:"extra_data"`
	Resolved      bool             `json:"resolved"`
	CreatedAt     time.Time        `json:"created_at"`
}
