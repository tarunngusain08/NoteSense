package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Note struct {
	ID         uuid.UUID    `gorm:"primaryKey" json:"id"`
	UserID     string    `json:"userId"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	Emoji      string    `json:"emoji"`
	Categories pq.StringArray `gorm:"type:text[]" json:"categories"`
	CreatedAt  time.Time `json:"createdAt"`

	UpdatedAt  time.Time `json:"updatedAt"`
}

func (n *Note) BeforeCreate(tx *gorm.DB) error {
	if n.Categories == nil {
		n.Categories = []string{}
	}
	return nil
}
