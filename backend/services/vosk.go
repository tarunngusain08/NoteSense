// backend/services/vosk.go
package services

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
)

const (
	DefaultModelPath = "./speech_models/vosk-model-small-en-us-0.15"
)

func DownloadVoskModel() error {
	modelDir := "./speech_models"
	modelURL := "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"

	// Create models directory
	if err := os.MkdirAll(modelDir, 0755); err != nil {
		return fmt.Errorf("failed to create models directory: %v", err)
	}

	// Download model
	modelZipPath := filepath.Join(modelDir, "vosk-model.zip")
	downloadCmd := fmt.Sprintf("wget -O %s %s", modelZipPath, modelURL)

	if err := exec.Command("sh", "-c", downloadCmd).Run(); err != nil {
		return fmt.Errorf("failed to download Vosk model: %v", err)
	}

	// Unzip model
	unzipCmd := fmt.Sprintf("unzip %s -d %s", modelZipPath, modelDir)
	if err := exec.Command("sh", "-c", unzipCmd).Run(); err != nil {
		return fmt.Errorf("failed to unzip Vosk model: %v", err)
	}

	// Clean up zip file
	os.Remove(modelZipPath)

	return nil
}

func ValidateVoskModel(modelPath string) error {
	// Check if model directory exists
	if _, err := os.Stat(modelPath); os.IsNotExist(err) {
		log.Printf("Vosk model not found at %s. Attempting to download...", modelPath)
		if err := DownloadVoskModel(); err != nil {
			return fmt.Errorf("failed to download Vosk model: %v", err)
		}
	}

	// Additional validation can be added here
	return nil
}
