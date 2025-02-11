package ocr

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os/exec"
)

type OCRService struct{}

func NewOCRService() *OCRService {
	return &OCRService{}
}

func (s *OCRService) ExtractText(imagePath string) (string, error) {
	// Python script that uses EasyOCR
	script := `
import sys
import easyocr
import json
import traceback
import os

def perform_ocr(image_path):
    try:
        # Disable progress bars
        os.environ['EASYOCR_DISABLE_PROGRESS_BAR'] = 'True'
        reader = easyocr.Reader(['en'], verbose=False)
        results = reader.readtext(image_path)
        text = ' '.join([result[1] for result in results])
        return {'success': True, 'text': text}
    except Exception as e:
        return {'success': False, 'error': str(e), 'traceback': traceback.format_exc()}

if __name__ == '__main__':
    try:
        image_path = sys.argv[1]
        result = perform_ocr(image_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e), 'traceback': traceback.format_exc()}))
`

	// Create a temporary Python script
	cmd := exec.Command("py", "-c", script, imagePath)
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
