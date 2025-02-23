package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FileMetadata struct {
	gorm.Model
	ID            uuid.UUID `gorm:"type:uuid;primary_key"`
	UserID        uuid.UUID `gorm:"type:uuid;not null"`
	FileName      string    `gorm:"not null"`
	FileType      string    `gorm:"not null"` // "image" or "audio"
	FilePath      string    `gorm:"not null"`
	ExtractedText string    `gorm:"type:text"`
	ProcessedAt   time.Time
}

// BeforeCreate will set a UUID for the FileMetadata
func (f *FileMetadata) BeforeCreate(tx *gorm.DB) (err error) {
	f.ID = uuid.New()
	return
}
