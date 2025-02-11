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

type AudioUploader struct {
	BaseUploader
}

func NewAudioUploader() *AudioUploader {
	return &AudioUploader{
		BaseUploader: BaseUploader{
			MaxFileSize:  50 * 1024 * 1024, // 50MB
			AllowedTypes: []string{".mp3", ".wav", ".m4a", ".aac", ".ogg"},
		},
	}
}

func (u *AudioUploader) Upload(file *multipart.FileHeader, userID uuid.UUID) (*models.File, error) {
	if err := u.ValidateFile(file); err != nil {
		return nil, err
	}

	uploadDir := "uploads/audio"
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
		Type:     models.AudioFile,
		Path:     filepath,
		Size:     file.Size,
		MimeType: file.Header.Get("Content-Type"),
	}

	return fileModel, nil
}
