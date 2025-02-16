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

type VideoUploader struct {
	BaseUploader
}

func NewVideoUploader() Uploader {
	return &VideoUploader{
		BaseUploader: BaseUploader{
			MaxFileSize:  100 * 1024 * 1024, // 100MB
			AllowedTypes: []string{".mp4", ".avi", ".mov", ".wmv", ".mkv"},
		},
	}
}

func (u *VideoUploader) Upload(file *multipart.FileHeader, userID uuid.UUID) (*models.File, error) {
	if err := u.ValidateFile(file); err != nil {
		return nil, err
	}

	uploadDir := "uploads/videos"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %v", err)
	}

	ext := filepath.Ext(file.Filename)
	filename := uuid.New().String() + ext
	filepath := filepath.Join(uploadDir, filename)

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

	fileModel := &models.File{
		ID:       uuid.New(),
		UserID:   userID,
		Name:     file.Filename,
		Type:     models.VideoFile,
		Path:     filepath,
		Size:     file.Size,
		MimeType: file.Header.Get("Content-Type"),
	}

	return fileModel, nil
}
