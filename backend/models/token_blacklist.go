package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TokenBlacklist struct {
	gorm.Model
	UserID    uuid.UUID `gorm:"type:uuid"`
	TokenUUID string    `gorm:"uniqueIndex"`
	ExpiresAt time.Time
}

func (tb *TokenBlacklist) BeforeCreate(tx *gorm.DB) (err error) {
	if tb.ID == 0 {
		tb.ID = uuid.New().ID()
	}
	return
}
