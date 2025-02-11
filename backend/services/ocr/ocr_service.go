package ocr

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os/exec"
	"path/filepath"
	"runtime"
)

type OCRService struct{}

func NewOCRService() *OCRService {
	return &OCRService{}
}

func (s *OCRService) ExtractText(imagePath string) (string, error) {
	// Get the directory of the current Go file
	_, currentFile, _, _ := runtime.Caller(0)
	scriptPath := filepath.Join(filepath.Dir(currentFile), "ocr_script.py")

	// Execute the external Python script
	cmd := exec.Command("py", scriptPath, imagePath)
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("OCR failed: %v, stderr: %s", err, stderr.String())
	}

	// Parse the JSON output
	var result struct {
		Success   bool   `json:"success"`
		Text      string `json:"text"`
		Error     string `json:"error"`
		Traceback string `json:"traceback"`
	}

	if err := json.Unmarshal(out.Bytes(), &result); err != nil {
		return "", fmt.Errorf("failed to parse OCR result: %v, output: %s", err, out.String())
	}

	if !result.Success {
		return "", fmt.Errorf("OCR processing failed: %s\nTraceback: %s", result.Error, result.Traceback)
	}

	return result.Text, nil
}
