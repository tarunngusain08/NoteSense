package contracts

import "NoteSense/models"

// NoteRequest represents the structure for note creation/update requests
type NoteRequest struct {
	Title       string   `json:"title"`
	Content     string   `json:"content"`
	Categories  []string `json:"categories"`
	UserID      string   `json:"userId"`
}

// NoteResponse represents the response for note operations
type NoteResponse struct {
	Note models.Note `json:"note"`
}

// NotesResponse represents a list of notes
type NotesResponse struct {
	Notes []models.Note `json:"notes"`
}
