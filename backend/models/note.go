package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Note struct {
	ID         uuid.UUID      `gorm:"primaryKey" json:"id"`
	UserID     uuid.UUID      `json:"userId"`
	Title      string         `json:"title"`
	Content    string         `json:"content"`
	Emoji      string         `json:"emoji"`
	Categories pq.StringArray `gorm:"type:text[]" json:"categories"`
	Status     string         `json:"status" gorm:"default:'backlog'"` // Kanban status
	Priority   int            `json:"priority" gorm:"default:0"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
}

const (
	StateTodo       = "todo"
	StateInProgress = "in_progress"
	StateDone       = "done"
)

func (n *Note) BeforeCreate(tx *gorm.DB) error {
	if n.Categories == nil {
		n.Categories = []string{}
	}

	// Set default status if not provided
	if n.Status == "" {
		n.Status = "Backlog"
	}

	return nil
}
