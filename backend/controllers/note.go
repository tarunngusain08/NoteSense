package controllers

import (
	"NoteSense/contracts"
	"NoteSense/services"
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// NoteHandler holds the note service
type NoteHandler struct {
	NoteService *services.NoteService
}

// CreateNoteHandler handles creating a new note
func (h *NoteHandler) CreateNoteHandler(w http.ResponseWriter, r *http.Request) {
	// Decode request body
	var req contracts.NoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Create note
	note, err := h.NoteService.CreateNote(req.Title, req.Content, req.Categories, req.UserID)
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
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	// Get notes
	notes, err := h.NoteService.GetNotesByUserID(userID)
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

	// Update note
	note, err := h.NoteService.UpdateNote(noteID, req.Title, req.Content, req.Categories)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Return updated note
	w.Header().Set("Content-Type", "application/json")
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

	// Get user ID from context (assuming middleware sets this)
	userID, ok := r.Context().Value("userID").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
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

