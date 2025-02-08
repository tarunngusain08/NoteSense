package controllers

import (
	"net/http"

	"NoteSense/services" // Adjust the import path
)

// NoteHandler holds the note service
type NoteHandler struct {
	NoteService *services.NoteService
}

// CreateNoteHandler handles creating a new note
func (h *NoteHandler) CreateNoteHandler(w http.ResponseWriter, r *http.Request) {
	err := h.NoteService.CreateNote(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

// GetNoteHandler handles retrieving a note
func (h *NoteHandler) GetNoteHandler(w http.ResponseWriter, r *http.Request) {
	note, err := h.NoteService.GetNote(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	w.Write([]byte(note))
}

// UpdateNoteHandler handles updating a note
func (h *NoteHandler) UpdateNoteHandler(w http.ResponseWriter, r *http.Request) {
	err := h.NoteService.UpdateNote(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// DeleteNoteHandler handles deleting a note
func (h *NoteHandler) DeleteNoteHandler(w http.ResponseWriter, r *http.Request) {
	err := h.NoteService.DeleteNote(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
