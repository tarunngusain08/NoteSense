package controllers

import (
	"NoteSense/contracts"
	"NoteSense/services"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// NoteHandler holds the note service
type NoteHandler struct {
	NoteService *services.NoteService
}

// CreateNoteHandler handles creating a new note
func (h *NoteHandler) CreateNoteHandler(w http.ResponseWriter, r *http.Request) {

	userID, err := extractUserID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	// Decode request body
	var req contracts.NoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	// Create note
	note, err := h.NoteService.CreateNote(*req.Title, *req.Content, *req.Categories, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Return created note
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(contracts.NoteResponse{Note: *note})
}

// GetNoteHandler handles retrieving notes
func (h *NoteHandler) GetNoteHandler(w http.ResponseWriter, r *http.Request) {

	// Extract user ID from query params
	userID, err := extractUserID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	// Get notes
	notes, err := h.NoteService.GetNotesByUserID(userID.String())
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Return notes
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(contracts.NotesResponse{Notes: notes})
}

// UpdateNoteHandler handles updating a note
func (h *NoteHandler) UpdateNoteHandler(w http.ResponseWriter, r *http.Request) {
	// Get note ID from URL
	vars := mux.Vars(r)
	noteID, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, "Invalid note ID format", http.StatusBadRequest)
		return
	}

	// Decode request body
	var req contracts.NoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Parse userID from string to UUID
	userID, err := extractUserID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Update note
	note, err := h.NoteService.UpdateNote(noteID, req.Title, req.Content, req.Categories, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Return updated note
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(contracts.NoteResponse{Note: *note})
}

// DeleteNoteHandler handles deleting a note
func (h *NoteHandler) DeleteNoteHandler(w http.ResponseWriter, r *http.Request) {
	// Get note ID from URL
	vars := mux.Vars(r)
	noteID, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, "Invalid note ID format", http.StatusBadRequest)
		return
	}

	userID, err := extractUserID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Delete note
	if err := h.NoteService.DeleteNote(noteID, userID); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Return success
	w.WriteHeader(http.StatusNoContent)
}

func extractUserID(r *http.Request) (uuid.UUID, error) {
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		return uuid.Nil, fmt.Errorf("missing Authorization token")
	}

	// Remove "Bearer " prefix
	tokenString = strings.TrimPrefix(tokenString, "Bearer ")
	// Parse JWT token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		secretKey := os.Getenv("JWT_SECRET")
		if secretKey == "" {
			return nil, fmt.Errorf("JWT_SECRET_KEY not set")
		}
		return []byte(secretKey), nil
	})
	if err != nil {
		return uuid.Nil, fmt.Errorf("invalid token")
	}

	// Extract claims
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userIDStr, exists := claims["user_id"].(string)
		if !exists {
			return uuid.Nil, fmt.Errorf("user_id not found in token")
		}
		return uuid.Parse(userIDStr)
	}

	return uuid.Nil, fmt.Errorf("invalid token")
}
