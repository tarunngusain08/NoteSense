package upload

import (
	"NoteSense/models"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

type Uploader interface {
	Upload(file *multipart.FileHeader, userID uuid.UUID) (*models.File, error)
	ValidateFile(file *multipart.FileHeader) error
}

type BaseUploader struct {
	MaxFileSize  int64
	AllowedTypes []string
}

func (b *BaseUploader) ValidateFile(file *multipart.FileHeader) error {
	if file.Size > b.MaxFileSize {
		return fmt.Errorf("file size exceeds maximum allowed size")
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := false
	for _, t := range b.AllowedTypes {
		if ext == t {
			allowed = true
			break
		}
	}
	if !allowed {
		return fmt.Errorf("file type not allowed")
	}
	return nil
}
