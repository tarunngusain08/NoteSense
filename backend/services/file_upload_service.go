package services

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"

	"NoteSense/models"
	"NoteSense/repositories"
)

type FileUploadService struct {
	fileMetadataRepo *repositories.FileMetadataRepository
	speechService    *SpeechToTextService // Speech-to-text dependency
	ocrService       *OCRService          // Add OCR service dependency
}

// Update the constructor to accept OCRService
func NewFileUploadService(
	fileMetadataRepo *repositories.FileMetadataRepository,
	speechService *SpeechToTextService,
	ocrService *OCRService, // Add this parameter
) *FileUploadService {
	return &FileUploadService{
		fileMetadataRepo: fileMetadataRepo,
		speechService:    speechService,
		ocrService:       ocrService, // Set the OCR service
	}
}

func (s *FileUploadService) SaveFile(file *multipart.FileHeader, userID uuid.UUID) (*models.FileMetadata, error) {
	// Validate user
	if userID == uuid.Nil {
		return nil, fmt.Errorf("invalid user ID")
	}

	// Create upload directory if not exists
	uploadDir := "./../uploadedFiles"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return nil, fmt.Errorf("failed to create upload directory: %v", err)
	}

	// Generate unique filename
	fileExt := filepath.Ext(file.Filename)
	uniqueFileName := fmt.Sprintf("%s%s", uuid.New().String(), fileExt)
	filePath := filepath.Join(uploadDir, uniqueFileName)

	// Save uploaded file
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to create file: %v", err)
	}
	defer dst.Close()

	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %v", err)
	}
	defer src.Close()

	if _, err = io.Copy(dst, src); err != nil {
		return nil, fmt.Errorf("failed to save file: %v", err)
	}

	// Determine file type
	fileType := s.determineFileType(file.Filename)

	// Extract text based on file type
	var extractedText string
	switch fileType {
	case "image":
		extractedText, _ = s.ocrService.ProcessImage(filePath)
	case "audio":
		extractedText, _ = s.speechService.TranscribeAudio(filePath)
	}

	// Create file metadata
	fileMetadata := &models.FileMetadata{
		UserID:        userID,
		FileName:      file.Filename,
		FileType:      fileType,
		FilePath:      filePath,
		ExtractedText: extractedText,
		ProcessedAt:   time.Now(),
	}

	// Save metadata to database
	if err := s.fileMetadataRepo.Create(fileMetadata); err != nil {
		return nil, fmt.Errorf("failed to save file metadata: %v", err)
	}

	return fileMetadata, nil
}
func (s *FileUploadService) determineFileType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))

	imageExtensions := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true, ".gif": true,
	}

	audioExtensions := map[string]bool{
		".mp3": true, ".wav": true, ".ogg": true,
	}

	switch {
	case imageExtensions[ext]:
		return "image"
	case audioExtensions[ext]:
		return "audio"
	default:
		return "unsupported"
	}
}
