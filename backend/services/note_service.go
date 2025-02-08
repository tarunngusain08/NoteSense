package services

import (
	"NoteSense/models"
	"NoteSense/repositories"
	"context"
	"encoding/json"
	"net/http"
)

// NoteService holds the note repository
type NoteService struct {
	NoteRepo *repositories.NoteRepository
}

// NewNoteService creates a new NoteService
func NewNoteService(repo *repositories.NoteRepository) *NoteService {
	return &NoteService{NoteRepo: repo}
}

// CreateNote handles creating a new note
func (s *NoteService) CreateNote(r *http.Request) error {
	var note models.Note
	if err := json.NewDecoder(r.Body).Decode(&note); err != nil {
		return err
	}
	// Validate note data here
	return s.NoteRepo.Create(context.Background(), &note)
}

// GetNote handles retrieving a note
func (s *NoteService) GetNote(r *http.Request) (string, error) {
	// Extract note ID from URL
	// Implement logic to retrieve a note by ID
	return "note content", nil
}

// UpdateNote handles updating a note
func (s *NoteService) UpdateNote(r *http.Request) error {
	var note models.Note
	if err := json.NewDecoder(r.Body).Decode(&note); err != nil {
		return err
	}
	// Validate note data here
	return s.NoteRepo.Update(context.Background(), &note)
}

// DeleteNote handles deleting a note
func (s *NoteService) DeleteNote(r *http.Request) error {
	// Extract note ID from URL
	// Implement logic to delete a note by ID
	return nil
}
