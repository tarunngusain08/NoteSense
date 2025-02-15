package contracts

import "NoteSense/models"

// NoteRequest represents the structure for note creation/update requests
type NoteRequest struct {
	Title      *string   `json:"title,omitempty"`
	Content    *string   `json:"content,omitempty"`
	Categories *[]string `json:"categories,omitempty"`
	Status     *string   `json:"status,omitempty"`
	UserID     string    `json:"userId"`
}

// NoteResponse represents the response for note operations
type NoteResponse struct {
	Note models.Note `json:"note"`
}

// NotesResponse represents a list of notes
type NotesResponse struct {
	Notes []models.Note `json:"notes"`
}

// UpdateNoteStateRequest represents the request to update a note's state
type UpdateNoteStateRequest struct {
	State  string `json:"state"`
	UserID string `json:"userId"`
}

// KanbanNotesResponse represents notes organized in Kanban columns
type KanbanNotesResponse struct {
	Backlog       []models.Note `json:"backlog"`
	Todo          []models.Note `json:"todo"`
	InProgress    []models.Note `json:"in_progress"`
	Done          []models.Note `json:"done"`
	Uncategorized []models.Note `json:"uncategorized"`
}

// SearchNotesRequest represents the request structure for searching notes
type SearchNotesRequest struct {
	Query      string   `json:"q"`
	Categories []string `json:"categories,omitempty"`
	UserID     string   `json:"userId"`
}
