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

// GetNotesHandler handles retrieving all notes for a user
func (h *NoteHandler) GetNotesHandler(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from token
	userID, err := extractUserID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Get notes
	notes, err := h.NoteService.GetNotesByUserID(userID.String())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return notes
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(contracts.NotesResponse{Notes: notes})
}

// GetNoteHandler handles retrieving a single note by ID
func (h *NoteHandler) GetNoteHandler(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from token
	userID, err := extractUserID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Get note ID from URL parameters
	vars := mux.Vars(r)
	noteID, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	// Get note from service
	note, err := h.NoteService.GetNoteByID(noteID, userID)
	if err != nil {
		if err.Error() == "note not found" {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return note
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(contracts.NoteResponse{Note: *note})
}

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
	note, err := h.NoteService.UpdateNote(noteID, req.Title, req.Content, req.Categories, req.Status, userID)
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

func (c *NoteHandler) UpdateNoteStateAndPriorityHandler(w http.ResponseWriter, r *http.Request) {
	// Parse note ID from URL
	vars := mux.Vars(r)
	noteIDStr := vars["id"]
	noteID, err := uuid.Parse(noteIDStr)
	if err != nil {
		http.Error(w, "Invalid note ID", http.StatusBadRequest)
		return
	}

	// Extract userID from token
	userID, err := extractUserID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Decode request body
	var updateRequest struct {
		Status   *string `json:"status,omitempty"`
		Priority *int    `json:"priority,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&updateRequest); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Update note in service
	note, err := c.NoteService.UpdateNoteStateAndPriority(noteID, updateRequest.Status, updateRequest.Priority, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return updated note
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(note)
}

// GetKanbanNotesHandler handles retrieving notes in Kanban-style organization
func (h *NoteHandler) GetKanbanNotesHandler(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from token
	userID, err := extractUserID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Get Kanban notes
	kanbanNotes, err := h.NoteService.GetKanbanNotes(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return Kanban notes
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(kanbanNotes)
}

// SearchNotesHandler handles searching notes
func (h *NoteHandler) SearchNotesHandler(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from token
	userID, err := extractUserID(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Decode search request
	var req contracts.SearchNotesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Perform search
	notes, err := h.NoteService.SearchNotes(req.Query, req.Categories, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Return search results
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(contracts.NotesResponse{Notes: notes})
}
