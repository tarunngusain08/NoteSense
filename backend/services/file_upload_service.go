package services

import (
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/otiai10/gosseract/v2"

	"NoteSense/models"
	"NoteSense/repositories"
)

type FileUploadService struct {
	fileRepo *repositories.FileMetadataRepository
}

func NewFileUploadService(repo *repositories.FileMetadataRepository) *FileUploadService {
	return &FileUploadService{
		fileRepo: repo,
	}
}

func (s *FileUploadService) SaveFile(file *multipart.FileHeader, userID uuid.UUID) (*models.FileMetadata, error) {
	// Validate file type
	fileType := s.determineFileType(file.Filename)
	if fileType == "unsupported" {
		return nil, fmt.Errorf("unsupported file type")
	}

	// Create upload directory if not exists
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return nil, err
	}

	// Generate unique filename
	uniqueFilename := fmt.Sprintf("%s%s", uuid.New().String(), filepath.Ext(file.Filename))
	filePath := filepath.Join(uploadDir, uniqueFilename)

	// Save file
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	dst, err := os.Create(filePath)
	if err != nil {
		return nil, err
	}
	defer dst.Close()

	_, err = io.Copy(dst, src)
	if err != nil {
		return nil, err
	}

	// Process file based on type
	extractedText := ""
	switch fileType {
	case "image":
		extractedText, err = s.processOCR(filePath)
	case "audio":
		extractedText, err = s.processSpeechToText(filePath)
	}

	if err != nil {
		log.Printf("Processing error: %v", err)
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
	return s.fileRepo.Create(fileMetadata)
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

func (s *FileUploadService) processOCR(filePath string) (string, error) {
	client := gosseract.NewClient()

	defer client.Close()

	// Advanced configuration
	client.SetLanguage("eng") // English
	client.SetPageSegMode(gosseract.PSM_AUTO)
	client.SetVariable("tessedit_char_whitelist", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")

	client.SetImage(filePath)

	// Optional: Preprocessing for better accuracy
	// You might want to add image preprocessing steps here

	text, err := client.Text()
	if err != nil {
		return "", err
	}

	return text, nil
}

func (s *FileUploadService) processSpeechToText(filePath string) (string, error) {

	speechService, err := NewSpeechToTextService("/path/to/google-credentials.json")

	if err != nil {
		log.Printf("Failed to initialize speech-to-text service: %v", err)
		return "", err
	}
	defer speechService.Close()

	// Transcribe audio file
	transcription, err := speechService.TranscribeAudio(filePath)
	if err != nil {
		log.Printf("Audio transcription failed: %v", err)
		return "", err
	}

	return transcription, nil
}
