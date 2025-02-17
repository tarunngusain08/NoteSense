package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// ConnectionType defines the types of connections between notes
type ConnectionType string

// Predefined connection types
const (
	RelatedConnection     ConnectionType = "related"
	DependsOnConnection   ConnectionType = "depends_on"
	InspirationConnection ConnectionType = "inspiration"
)

type Note struct {
	ID         uuid.UUID      `gorm:"primaryKey" json:"id"`
	UserID     uuid.UUID      `json:"userId"`
	Title      string         `json:"title"`
	Content    string         `json:"content"`
	Emoji      string         `json:"emoji"`
	Categories pq.StringArray `gorm:"type:text[]" json:"categories"`
	Status     string         `json:"status" gorm:"default:'backlog'"` // Kanban status
	Priority   int            `json:"priority" gorm:"default:0"`

	// New fields for note connections
	ConnectedNoteIDs pq.StringArray `gorm:"type:uuid[]" json:"connectedNoteIds,omitempty"`
	ConnectionTypes  pq.StringArray `gorm:"type:text[]" json:"connectionTypes,omitempty"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

const (
	StateTodo       = "todo"
	StateInProgress = "in_progress"
	StateDone       = "done"
)

func (n *Note) BeforeCreate(tx *gorm.DB) error {
	// Existing initializations
	if n.Categories == nil {
		n.Categories = []string{}
	}

	// Set default status if not provided
	if n.Status == "" {
		n.Status = "Backlog"
	}

	// Initialize connection-related fields
	if n.ConnectedNoteIDs == nil {
		n.ConnectedNoteIDs = []string{}
	}
	if n.ConnectionTypes == nil {
		n.ConnectionTypes = []string{}
	}

	return nil
}

// AddConnection adds a connection to the note
func (n *Note) AddConnection(noteID uuid.UUID, connectionType ConnectionType) error {
	// Prevent duplicate connections
	noteIDStr := noteID.String()
	for _, existingID := range n.ConnectedNoteIDs {
		if existingID == noteIDStr {
			return fmt.Errorf("note already connected")
		}
	}

	// Limit connections to 10
	if len(n.ConnectedNoteIDs) >= 10 {
		return fmt.Errorf("maximum number of connections reached")
	}

	// Add connection
	n.ConnectedNoteIDs = append(n.ConnectedNoteIDs, noteIDStr)
	n.ConnectionTypes = append(n.ConnectionTypes, string(connectionType))

	return nil
}

// GetConnections returns the connected notes and their connection types
func (n *Note) GetConnections() []struct {
	NoteID         uuid.UUID
	ConnectionType ConnectionType
} {
	var connections []struct {
		NoteID         uuid.UUID
		ConnectionType ConnectionType
	}

	for i, idStr := range n.ConnectedNoteIDs {
		noteID, err := uuid.Parse(idStr)
		if err == nil {
			connections = append(connections, struct {
				NoteID         uuid.UUID
				ConnectionType ConnectionType
			}{
				NoteID:         noteID,
				ConnectionType: ConnectionType(n.ConnectionTypes[i]),
			})
		}
	}

	return connections
}

// RemoveConnection removes a specific connection
func (n *Note) RemoveConnection(noteID uuid.UUID) error {
	noteIDStr := noteID.String()
	for i, existingID := range n.ConnectedNoteIDs {
		if existingID == noteIDStr {
			// Remove the connection
			n.ConnectedNoteIDs = append(n.ConnectedNoteIDs[:i], n.ConnectedNoteIDs[i+1:]...)
			n.ConnectionTypes = append(n.ConnectionTypes[:i], n.ConnectionTypes[i+1:]...)
			return nil
		}
	}

	return fmt.Errorf("connection not found")
}
