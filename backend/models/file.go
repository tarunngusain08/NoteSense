package models

import (
	"time"

	"github.com/google/uuid"
)

type FileType string

const (
	ImageFile    FileType = "image"
	DocumentFile FileType = "document"
	AudioFile    FileType = "audio"
	VideoFile    FileType = "video"
)

type File struct {
	ID        uuid.UUID `gorm:"primaryKey" json:"id"`
	UserID    uuid.UUID `json:"userId"`
	Name      string    `json:"name"`
	Type      FileType  `json:"type"`
	Path      string    `json:"path"`
	Size      int64     `json:"size"`
	MimeType  string    `json:"mimeType"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
