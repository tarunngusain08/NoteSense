package upload

import (
	"NoteSense/models"
	"NoteSense/services/ocr"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

type ImageUploader struct {
	BaseUploader
	OCRService *ocr.OCRService
}

func NewImageUploader(ocrService *ocr.OCRService) *ImageUploader {
	return &ImageUploader{
		BaseUploader: BaseUploader{
			MaxFileSize:  5 * 1024 * 1024, // 5MB
			AllowedTypes: []string{".jpg", ".jpeg", ".png", ".gif"},
		},
		OCRService: ocrService,
	}
}

func (u *ImageUploader) Upload(file *multipart.FileHeader, userID uuid.UUID) (*models.File, error) {
	if err := u.ValidateFile(file); err != nil {
		return nil, fmt.Errorf("file validation failed: %w", err)
	}

	// Create uploads directory if it doesn't exist
	uploadDir := "uploads/images"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %w", err)
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := uuid.New().String() + ext
	filePath := filepath.Join(uploadDir, filename)

	// Save file
	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer src.Close()

	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create destination file: %w", err)
	}
	defer dst.Close()

	if _, err = io.Copy(dst, src); err != nil {
		return nil, fmt.Errorf("failed to copy file: %w", err)
	}

	// Get absolute path for OCR
	absPath, err := filepath.Abs(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to get absolute path: %w", err)
	}

	// Perform OCR on the saved image
	ocrText := ""
	if u.OCRService != nil {
		text, err := u.OCRService.ExtractText(absPath)
		if err != nil {
			// Log the error but continue - OCR failure shouldn't prevent file upload
			fmt.Printf("OCR failed for file %s: %v\n", absPath, err)
		} else {
			ocrText = text
		}
	}

	// Create file record
	fileModel := &models.File{
		ID:       uuid.New(),
		UserID:   userID,
		Name:     file.Filename,
		Type:     models.ImageFile,
		Path:     filePath,
		Size:     file.Size,
		MimeType: file.Header.Get("Content-Type"),
		OCRText:  ocrText,
	}

	return fileModel, nil
}
