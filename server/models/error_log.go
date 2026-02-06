package models

import (
	"encoding/json"
	"time"
)

type ErrorLog struct {
	ID            int              `json:"id"`
	ProjectID     int              `json:"projectId"`
	EnvironmentID int              `json:"environmentId"`
	ErrorGroupID  int              `json:"errorGroupId"`
	Timestamp     time.Time        `json:"timestamp"`
	Source        string           `json:"source"`
	Level         string           `json:"level"`
	Message       string           `json:"message"`
	Stack         *string          `json:"stack"`
	URL           *string          `json:"url"`
	Method        *string          `json:"method"`
	UserAgent     *string          `json:"userAgent"`
	UserID        *string          `json:"userId"`
	StatusCode    *int             `json:"statusCode"`
	ExtraData     *json.RawMessage `json:"extraData"`
	Resolved      bool             `json:"resolved"`
	CreatedAt     time.Time        `json:"createdAt"`
}
