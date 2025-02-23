package contracts

import (
	"NoteSense/models"

	"github.com/google/uuid"
)

// ConnectionRequest represents the payload for creating a note connection
type ConnectionRequest struct {
	ConnectedNoteID string `json:"connectedNoteId"`
	ConnectionType  string `json:"connectionType"`
}

// ConnectionResponse represents the response for note connections
type ConnectionResponse struct {
	NoteID      uuid.UUID    `json:"noteId"`
	Connections []Connection `json:"connections"`
}

// Connection represents a single note connection
type Connection struct {
	NoteID         uuid.UUID `json:"noteId"`
	ConnectionType string    `json:"connectionType"`
}

// NoteRequest represents the structure for note creation/update requests
type NoteRequest struct {
	Title      string   `json:"title,omitempty"`
	Content    string   `json:"content,omitempty"`
	Categories []string `json:"categories,omitempty"`
	Status     string   `json:"status,omitempty"`
	UserID     string   `json:"userId"`
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
	Backlog    []models.Note `json:"backlog"`
	Todo       []models.Note `json:"todo"`
	InProgress []models.Note `json:"in_progress"`
	Done       []models.Note `json:"done"`
}

// SearchNotesRequest represents the request structure for searching notes
type SearchNotesRequest struct {
	Query      string   `json:"q"`
	Categories []string `json:"categories,omitempty"`
	UserID     string   `json:"userId"`
}

// MindmapNotesResponse represents notes and their connections for mindmap visualization
type MindmapNotesResponse struct {
	NoteConnections map[uuid.UUID][]uuid.UUID `json:"noteConnections"`
}

// UpdateNoteRequest defines the structure for updating a note
type UpdateNoteRequest struct {
	NoteID     uuid.UUID `json:"noteId" validate:"required"`
	Title      string    `json:"title" validate:"omitempty,min=1,max=255"`
	Content    string    `json:"content"`
	Categories []string  `json:"categories" validate:"omitempty,dive,min=1,max=50"`
	Status     string    `json:"status" validate:"omitempty,oneof=draft completed archived"`
}
