package services

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type SpeechToTextService struct{}

func NewSpeechToTextService() *SpeechToTextService {
	return &SpeechToTextService{}
}

func (s *SpeechToTextService) TranscribeAudio(audioPath string) (string, error) {
	// Use absolute path to the script
	scriptPath, err := filepath.Abs("./scripts/speech_to_text.py")
	if err != nil {
		return "", fmt.Errorf("failed to get script path: %v", err)
	}

	// print current working directory
	pythonPath := os.Getenv("PYTHON_VENV_PATH")
	if pythonPath == "" {
		return "", fmt.Errorf("PYTHON_VENV_PATH environment variable not set")
	}
	cmd := exec.Command(pythonPath, scriptPath, audioPath)
	cmd.Dir = "../uploadedFiles" // Set working directory

	output, err := cmd.Output()
	if err != nil {
		log.Printf("Speech-to-Text error: %v", err)

		// Check for more detailed error information
		if exitErr, ok := err.(*exec.ExitError); ok {
			log.Printf("Stderr: %s", string(exitErr.Stderr))
		}

		return "", fmt.Errorf("speech transcription failed: %v", err)
	}

	// Trim whitespace and newlines
	transcription := strings.TrimSpace(string(output))

	log.Printf("Transcribed Text: %s", transcription)
	return transcription, nil
}
