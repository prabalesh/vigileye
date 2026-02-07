package models

import "time"

type ProjectMember struct {
	ProjectID int       `json:"project_id"`
	UserID    int       `json:"user_id"`
	Role      string    `json:"role"` // 'admin' or 'member'
	CreatedAt time.Time `json:"created_at"`
}
