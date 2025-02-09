package services

import (
	"context"
	"fmt"

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
		ID:        uuid.New(),
		Title:      title,
		Content:    content,
		Categories: categories,
		UserID:     userID,
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
func (s *NoteService) UpdateNote(noteID uuid.UUID, title *string, content *string, categories *[]string, userID uuid.UUID) (*models.Note, error) {
	// Retrieve existing note to get UserID and set the ID
	existingNote, err := s.NoteRepo.GetByID(context.Background(), noteID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve existing note: %v", err)
	}

	// Prepare update data with existing values
	updateData := models.Note{
		ID:         noteID,
		UserID:     existingNote.UserID,
		Title:      existingNote.Title,
		Content:    existingNote.Content,
		Categories: existingNote.Categories,
	}

	// Update fields if provided
	if title != nil {
		if *title == "" {
			return nil, fmt.Errorf("title cannot be empty")
		}
		updateData.Title = *title
	}

	if content != nil {
		updateData.Content = *content
	}

	if categories != nil {
		updateData.Categories = *categories
	}

	// Update note in repository
	err = s.NoteRepo.Update(context.Background(), &updateData)
	if err != nil {
		return nil, fmt.Errorf("failed to update note: %v", err)
	}

	// Retrieve and return the updated note
	updatedNote, err := s.NoteRepo.GetByID(context.Background(), noteID, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve updated note: %v", err)
	}

	return updatedNote, nil
}

// DeleteNote deletes a note by its ID
func (s *NoteService) DeleteNote(noteID uuid.UUID, userID uuid.UUID) error {
	// Validate input
	if noteID == uuid.Nil {
		return fmt.Errorf("invalid note ID")

	}

	// First, retrieve the note to return
	note, err := s.NoteRepo.GetByID(context.Background(), noteID, userID)
	if err != nil {
		return fmt.Errorf("failed to retrieve note: %v", err)
	}
	if note == nil {
		return fmt.Errorf("note not found")
	}

	// Delete note from repository
	if err := s.NoteRepo.Delete(context.Background(), noteID, userID); err != nil {
		return fmt.Errorf("failed to delete note: %v", err)
	}

	return nil
}
