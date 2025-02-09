package upload

import (
	"NoteSense/models"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

type ImageUploader struct {
	BaseUploader
}

func NewImageUploader() *ImageUploader {
	return &ImageUploader{
		BaseUploader: BaseUploader{
			MaxFileSize:  5 * 1024 * 1024, // 5MB
			AllowedTypes: []string{".jpg", ".jpeg", ".png", ".gif"},
		},
	}
}

func (u *ImageUploader) Upload(file *multipart.FileHeader, userID uuid.UUID) (*models.File, error) {
	if err := u.ValidateFile(file); err != nil {
		return nil, err
	}

	// Create uploads directory if it doesn't exist
	uploadDir := "uploads/images"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %v", err)
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := uuid.New().String() + ext
	filepath := filepath.Join(uploadDir, filename)

	// Save file
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	dst, err := os.Create(filepath)
	if err != nil {
		return nil, err
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		return nil, err
	}

	// Create file record
	fileModel := &models.File{
		ID:       uuid.New(),
		UserID:   userID,
		Name:     file.Filename,
		Type:     models.ImageFile,
		Path:     filepath,
		Size:     file.Size,
		MimeType: file.Header.Get("Content-Type"),
	}

	return fileModel, nil
}
