package controllers

import (
	"encoding/json"
	"log"
	"net/http"
	"path/filepath"
	"strings"

	"NoteSense/services"
)

type FileHandler struct {
	uploadService *services.FileUploadService
}

func NewFileHandler(service *services.FileUploadService) *FileHandler {
	return &FileHandler{
		uploadService: service,
	}
}

func isValidFileType(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	validExtensions := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".mp3":  true,
		".wav":  true,
		".ogg":  true,
		".pdf":  true,
		".doc":  true,
		".docx": true,
		".txt":  true,
	}
	return validExtensions[ext]
}

func (h *FileHandler) UploadFileHandler(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from context with better error handling
	userID, err := extractUserID(r)
	if err != nil {
		http.Error(w, "Invalid user authentication", http.StatusUnauthorized)
		return
	}

	// Parse multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file type and size
	if !isValidFileType(header.Filename) {
		http.Error(w, "Unsupported file type", http.StatusBadRequest)
		return
	}

	// Save file
	metadata, err := h.uploadService.SaveFile(header, userID)
	if err != nil {
		log.Printf("File upload error: %v", err)
		http.Error(w, "Failed to upload file", http.StatusInternalServerError)
		return
	}

	// Respond with metadata
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metadata)
}
