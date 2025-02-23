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

	"NoteSense/contracts"
	"NoteSense/models"
	"NoteSense/repositories"
	"log"
	"os/exec"
)

type FileUploadService struct {
	fileMetadataRepo *repositories.FileMetadataRepository
	speechService    *SpeechToTextService // Speech-to-text dependency
	ocrService       *OCRService          // Add OCR service dependency
	noteService      *NoteService
}

// Update the constructor to accept OCRService
func NewFileUploadService(
	fileMetadataRepo *repositories.FileMetadataRepository,
	speechService *SpeechToTextService,
	ocrService *OCRService, // Add this parameter
	noteService *NoteService,
) *FileUploadService {
	return &FileUploadService{
		fileMetadataRepo: fileMetadataRepo,
		speechService:    speechService,
		ocrService:       ocrService, // Set the OCR service
		noteService:      noteService,
	}
}

func (s *FileUploadService) SaveFile(file *multipart.FileHeader, userID uuid.UUID, noteID uuid.UUID) (*models.FileMetadata, error) {
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
	var additionalMargin string
	switch fileType {
	case "image":
		extractedText, _ = s.ocrService.ProcessImage(filePath)
		additionalMargin = "------------------------------ Data extracted from image --------------------------------"
	case "audio":
		extractedText, _ = s.speechService.TranscribeAudio(filePath)
		additionalMargin = "------------------------------ Data extracted from audio --------------------------------"
	}

	enrichedText, err := s.enrichText(extractedText)
	if err != nil {
		log.Printf("Text enrichment error: %v", err)
		// Use original text if enrichment fails
		enrichedText = extractedText
	}

	// Create file metadata
	fileMetadata := &models.FileMetadata{
		UserID:        userID,
		FileName:      file.Filename,
		FileType:      fileType,
		FilePath:      filePath,
		ExtractedText: enrichedText,
		ProcessedAt:   time.Now(),
	}

	// Save metadata to database
	if err := s.fileMetadataRepo.Create(fileMetadata); err != nil {
		return nil, fmt.Errorf("failed to save file metadata: %v", err)
	}

	// Implement appending the extracted text to the existing Note contents
	note, err := s.noteService.GetNoteByID(noteID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to add text to note: %v", err)
	}

	if _, err := s.noteService.UpdateNote(&contracts.UpdateNoteRequest{
		NoteID:  noteID,
		Content: note.Content + "\n\n" + additionalMargin + "\n" + enrichedText,
	}, userID); err != nil {
		return nil, fmt.Errorf("failed to update note: %v", err)
	}

	return fileMetadata, nil
}

func (s *FileUploadService) determineFileType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))

	imageExtensions := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true, ".gif": true,
	}

	audioExtensions := map[string]bool{
		".mp3": true, ".wav": true, ".ogg": true, ".m4a": true,
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

func (s *FileUploadService) enrichText(text string) (string, error) {
	// Path to advanced enrichment script
	// log.Printf("enrichText executing with text: %s", text)
	scriptPath, err := filepath.Abs("./scripts/advanced_ocr_enrichment.py")
	if err != nil {
		return "", fmt.Errorf("failed to get script path: %v", err)
	}

	// Path to virtual environment python executable
	pythonPath := filepath.Join(filepath.Dir(scriptPath), "venv", "bin", "python3")

	// Construct command to run enrichment script
	cmd := exec.Command(pythonPath, scriptPath, text)
	cmd.Dir = filepath.Dir(scriptPath)

	// Capture output
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("text enrichment failed: %v", err)
	}

	return strings.TrimSpace(string(output))[23:], nil
}
