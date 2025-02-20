package controllers

import (
	"encoding/json"
	"log"
	"net/http"

	"NoteSense/services"

	"github.com/google/uuid"
)

type FileHandler struct {
	uploadService *services.FileUploadService
}

func NewFileHandler(service *services.FileUploadService) *FileHandler {
	return &FileHandler{
		uploadService: service,
	}
}

func (h *FileHandler) UploadFileHandler(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB max
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	// Get the file from form
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Get user ID from context (you'll need to implement authentication middleware)
	userID, ok := r.Context().Value("userID").(uuid.UUID)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Save file and process
	metadata, err := h.uploadService.SaveFile(header, userID)
	if err != nil {
		log.Printf("File upload error: %v", err)
		http.Error(w, "File upload failed", http.StatusInternalServerError)
		return
	}

	// Respond with metadata
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metadata)
}
