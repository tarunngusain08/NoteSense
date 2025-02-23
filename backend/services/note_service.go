package services

import (
	"context"
	"fmt"

	"NoteSense/contracts"
	"NoteSense/models"
	"NoteSense/repositories"

	"github.com/google/uuid"
)

// NoteService handles note-related operations
type NoteService struct {
	NoteRepo *repositories.NoteRepository
}

// NewNoteService creates a new NoteService
func NewNoteService(repo *repositories.NoteRepository) *NoteService {
	return &NoteService{NoteRepo: repo}
}

// CreateNote creates a new note
func (s *NoteService) CreateNote(title, content string, categories []string, userID uuid.UUID) (*models.Note, error) {
	// Validate input
	if title == "" {
		return nil, fmt.Errorf("title is required")
	}
	if userID == uuid.Nil {
		return nil, fmt.Errorf("user ID is required")
	}

	// Create note model
	note := &models.Note{
		ID:         uuid.New(),
		Title:      title,
		Content:    content,
		Categories: categories,
		UserID:     userID,
		Status:     "BACKLOG", // Default status
	}

	// Create note in repository
	if err := s.NoteRepo.Create(context.Background(), note); err != nil {
		return nil, err
	}

	return note, nil
}

// GetNotesByUserID retrieves notes for a specific user
func (s *NoteService) GetNotesByUserID(userID string) ([]models.Note, error) {
	// Validate input
	if userID == "" {
		return nil, fmt.Errorf("user ID is required")
	}

	// Retrieve notes from repository
	return s.NoteRepo.GetByUserID(context.Background(), userID)
}

// UpdateNote updates an existing note
func (s *NoteService) UpdateNote(req *contracts.UpdateNoteRequest, userID uuid.UUID) (*models.Note, error) {
	// Validate input
	// write defer method for panic recovery

	if req.NoteID == uuid.Nil {
		return nil, fmt.Errorf("invalid note ID")
	}

	// Retrieve existing note to get UserID and set the ID
	existingNote, err := s.NoteRepo.GetByID(req.NoteID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve existing note: %v", err)
	}

	// Prepare update data with existing values
	updateData := models.Note{
		ID:         req.NoteID,
		UserID:     existingNote.UserID,
		Title:      existingNote.Title,
		Content:    existingNote.Content,
		Categories: existingNote.Categories,
		Status:     existingNote.Status,
	}

	if req.Title != "" {
		updateData.Title = req.Title
	}

	if req.Content != "" {
		updateData.Content = req.Content
	}

	if req.Categories != nil {
		updateData.Categories = req.Categories
	}

	// Update note in repository
	err = s.NoteRepo.Update(context.Background(), &updateData)
	if err != nil {
		return nil, fmt.Errorf("failed to update note: %v", err)
	}

	// Retrieve and return the updated note
	updatedNote, err := s.NoteRepo.GetByID(req.NoteID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve updated note: %v", err)
	}

	return updatedNote, nil
}

// GetNoteByID retrieves a note by its ID and userID
func (s *NoteService) GetNoteByID(noteID uuid.UUID, userID uuid.UUID) (*models.Note, error) {
	if noteID == uuid.Nil {
		return nil, fmt.Errorf("note ID is required")
	}
	if userID == uuid.Nil {
		return nil, fmt.Errorf("user ID is required")
	}

	note, err := s.NoteRepo.GetByID(noteID, userID)
	if err != nil {
		return nil, err
	}
	if note == nil {
		return nil, fmt.Errorf("note not found")
	}

	return note, nil
}

// DeleteNote deletes a note by its ID
func (s *NoteService) DeleteNote(noteID uuid.UUID, userID uuid.UUID) error {
	// Validate input
	if noteID == uuid.Nil {
		return fmt.Errorf("invalid note ID")

	}

	// First, retrieve the note to return
	note, err := s.NoteRepo.GetByID(noteID, userID)
	if err != nil {
		return fmt.Errorf("failed to retrieve note: %v", err)
	}
	if note == nil {
		return fmt.Errorf("note not found")
	}

	// Delete note from repository
	if err := s.NoteRepo.Delete(noteID, userID); err != nil {
		return fmt.Errorf("failed to delete note: %v", err)
	}

	return nil
}

// SearchNotes searches notes based on query and optional categories
func (s *NoteService) SearchNotes(query string, categories []string, userID uuid.UUID) ([]models.Note, error) {
	// Validate input
	if userID == uuid.Nil {
		return nil, fmt.Errorf("user ID is required")
	}

	// Perform search in repository
	return s.NoteRepo.SearchNotes(context.Background(), query, categories, userID)
}

// GetKanbanNotes retrieves notes organized in Kanban columns
func (s *NoteService) GetKanbanNotes(userID uuid.UUID) (*contracts.KanbanNotesResponse, error) {
	// Validate input
	if userID == uuid.Nil {
		return nil, fmt.Errorf("user ID is required")
	}

	// Retrieve Kanban notes from repository
	kanbanNotes, err := s.NoteRepo.GetKanbanNotes(userID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve Kanban notes: %v", err)
	}

	// Convert to KanbanNotesResponse
	return &contracts.KanbanNotesResponse{
		Backlog:    kanbanNotes.Backlog,
		Todo:       kanbanNotes.Todo,
		InProgress: kanbanNotes.InProgress,
		Done:       kanbanNotes.Done,
	}, nil
}

// UpdateNoteState updates the state of a note
func (s *NoteService) UpdateNoteState(noteID uuid.UUID, req *contracts.UpdateNoteStateRequest) error {
	// Validate input
	if noteID == uuid.Nil {
		return fmt.Errorf("note ID is required")
	}

	// Extract userID from request
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %v", err)
	}

	// Validate state
	validStates := map[string]bool{
		"backlog":     true,
		"todo":        true,
		"in_progress": true,
		"done":        true,
	}
	if !validStates[req.State] {
		return fmt.Errorf("invalid state: %s", req.State)
	}

	// Update note status
	updateData := &models.Note{
		ID:     noteID,
		UserID: userID,
		Status: req.State,
	}

	// Perform update in repository
	err = s.NoteRepo.Update(context.Background(), updateData)
	if err != nil {
		return fmt.Errorf("failed to update note state: %v", err)
	}

	return nil
}

// UpdateNoteStateAndPriority updates the state and/or priority of a note
func (s *NoteService) UpdateNoteStateAndPriority(noteID uuid.UUID, status *string, priority *int, userID uuid.UUID) (*models.Note, error) {
	// Retrieve existing note
	existingNote, err := s.NoteRepo.GetByID(noteID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve existing note: %v", err)
	}

	// Validate state if provided
	if status != nil {
		validStates := map[string]bool{
			"backlog":     true,
			"todo":        true,
			"in_progress": true,
			"done":        true,
		}
		if !validStates[*status] {
			return nil, fmt.Errorf("invalid note state: %s", *status)
		}
	}

	// Validate priority if provided
	if priority != nil {
		if *priority < 0 || *priority > 3 {
			return nil, fmt.Errorf("priority must be between 0 and 3")
		}
	}

	// Prepare update data with existing values
	updateData := models.Note{
		ID:         noteID,
		UserID:     existingNote.UserID,
		Title:      existingNote.Title,
		Content:    existingNote.Content,
		Categories: existingNote.Categories,
		Status:     existingNote.Status,
		Priority:   existingNote.Priority,
	}

	// Update state if provided
	if status != nil {
		updateData.Status = *status
	}

	// Update priority if provided
	if priority != nil {
		updateData.Priority = *priority
	}

	// Update note in repository
	err = s.NoteRepo.Update(context.Background(), &updateData)
	if err != nil {
		return nil, fmt.Errorf("failed to update note: %v", err)
	}

	// Retrieve and return the updated note
	updatedNote, err := s.NoteRepo.GetByID(noteID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve updated note: %v", err)
	}

	return updatedNote, nil
}

// ConnectNotes connects two notes
func (s *NoteService) ConnectNotes(noteID, connectedNoteID uuid.UUID, connectionType string, userID uuid.UUID) error {
	// Validate input
	if noteID == uuid.Nil {
		return fmt.Errorf("note ID is required")
	}
	if connectedNoteID == uuid.Nil {
		return fmt.Errorf("connected note ID is required")
	}
	if connectionType == "" {
		return fmt.Errorf("connection type is required")
	}
	if userID == uuid.Nil {
		return fmt.Errorf("user ID is required")
	}

	// Prevent self-linking
	if noteID == connectedNoteID {
		return fmt.Errorf("cannot link a note to itself")
	}

	// Fetch the note to ensure it exists and belongs to the user
	note, err := s.GetNoteByID(noteID, userID)
	if err != nil {
		return err
	}

	// Check if already connected
	for _, existingID := range note.ConnectedNoteIDs {
		if existingID == connectedNoteID.String() {
			return fmt.Errorf("notes are already connected")
		}
	}

	// Verify the connected note exists and belongs to the user
	// We don't need to store the note, just verify it exists
	_, err = s.GetNoteByID(connectedNoteID, userID)
	if err != nil {
		return err
	}

	// Add connection to the note
	note.ConnectedNoteIDs = append(note.ConnectedNoteIDs, connectedNoteID.String())
	note.ConnectionTypes = append(note.ConnectionTypes, connectionType)

	// Save the updated note
	if err := s.NoteRepo.Update(context.Background(), note); err != nil {
		return fmt.Errorf("failed to update note connections: %v", err)
	}

	return nil
}

// UnlinkNotes removes a connection between two notes
func (s *NoteService) UnlinkNotes(noteID, connectedNoteID uuid.UUID, userID uuid.UUID) error {
	// Validate input
	if noteID == uuid.Nil {
		return fmt.Errorf("note ID is required")
	}
	if connectedNoteID == uuid.Nil {
		return fmt.Errorf("connected note ID is required")
	}
	if userID == uuid.Nil {
		return fmt.Errorf("user ID is required")
	}

	// Fetch the note to ensure it exists and belongs to the user
	note, err := s.GetNoteByID(noteID, userID)
	if err != nil {
		return err
	}

	// Find and remove the connection
	for i, existingIDStr := range note.ConnectedNoteIDs {
		if existingIDStr == connectedNoteID.String() {
			// Remove the connection
			note.ConnectedNoteIDs = append(note.ConnectedNoteIDs[:i], note.ConnectedNoteIDs[i+1:]...)
			note.ConnectionTypes = append(note.ConnectionTypes[:i], note.ConnectionTypes[i+1:]...)

			// Save the updated note
			if err := s.NoteRepo.Update(context.Background(), note); err != nil {
				return fmt.Errorf("failed to update note connections: %v", err)
			}

			return nil
		}
	}

	return fmt.Errorf("connection not found")
}

// GetNotesMindmap retrieves notes for mindmap visualization
func (s *NoteService) GetNotesMindmap(userIDStr string) (*contracts.MindmapNotesResponse, error) {
	// Parse user ID
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %v", err)
	}

	// Retrieve notes and connections for mindmap
	noteConnections, err := s.NoteRepo.GetNotesMindmap(context.Background(), userID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve notes for mindmap: %v", err)
	}

	// Create and return mindmap response
	return &contracts.MindmapNotesResponse{
		NoteConnections: noteConnections,
	}, nil
}
