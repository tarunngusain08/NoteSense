package controllers

import (
	"NoteSense/models"
	"NoteSense/services"
	"encoding/json"
	"net/http"
	"path/filepath"
)

type FileHandler struct {
	FileService *services.FileService
}

func (h *FileHandler) UploadFileHandler(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	// Get file from form
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Extract user ID from context (set by auth middleware)
	userID, err := extractUserID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Determine file type based on extension
	ext := filepath.Ext(header.Filename)
	var fileType models.FileType
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif":
		fileType = models.ImageFile
	case ".pdf", ".doc", ".docx", ".txt":
		fileType = models.DocumentFile
	case ".mp3", ".wav", ".ogg":
		fileType = models.AudioFile
	case ".mp4", ".avi", ".mov", ".wmv", ".mkv":
		fileType = models.VideoFile
	default:
		http.Error(w, "Unsupported file type", http.StatusBadRequest)
		return
	}

	// Upload file
	uploadedFile, err := h.FileService.UploadFile(header, fileType, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(uploadedFile)
}
