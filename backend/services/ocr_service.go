package services

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type OCRService struct{}

func NewOCRService() *OCRService {
	return &OCRService{}
}

func (s *OCRService) ProcessImage(imagePath string) (string, error) {
	// Get the current working directory
	currentDir, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("failed to get current directory: %v", err)
	}

	// Construct absolute path considering the project structure
	// Use filepath.Join to correctly handle path separators
	absImagePath := filepath.Join(currentDir, "..", "uploadedFiles", filepath.Base(imagePath))
	absImagePath = filepath.Clean(absImagePath)

	// Use absolute path to the script
	scriptPath, err := filepath.Abs("./scripts/ocr.py")
	if err != nil {
		return "", fmt.Errorf("failed to get script path: %v", err)
	}

	// Path to virtual environment python executable
	pythonPath := filepath.Join(filepath.Dir(scriptPath), "venv", "bin", "python3")

	// Extensive logging for debugging
	// log.Printf("Current Directory: %s", currentDir)
	// log.Printf("Image Relative Path: %s", imagePath)
	// log.Printf("Image Absolute Path: %s", absImagePath)
	// log.Printf("Script Path: %s", scriptPath)
	// log.Printf("Python Path: %s", pythonPath)

	// Check if image file exists
	if _, err := os.Stat(absImagePath); os.IsNotExist(err) {
		return "", fmt.Errorf("image file does not exist: %s", absImagePath)
	}

	// Construct command to run script with virtual env python
	cmd := exec.Command(pythonPath, scriptPath, absImagePath)
	cmd.Dir = filepath.Dir(scriptPath)

	// Capture both stdout and stderr
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("OCR error: %v", err)
		log.Printf("OCR output: %s", string(output))
		return "", fmt.Errorf("image text extraction failed: %v", err)
	}

	// Trim whitespace and newlines
	text := strings.TrimSpace(string(output))

	log.Printf("Extracted Text: %s", text)
	return text, nil
}
