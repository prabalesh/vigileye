package models

import "time"

type Project struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	OwnerID   int       `json:"ownerId"`
	CreatedAt time.Time `json:"createdAt"`
}

type ProjectMember struct {
	ProjectID int       `json:"projectId"`
	UserID    int       `json:"userId"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
}
