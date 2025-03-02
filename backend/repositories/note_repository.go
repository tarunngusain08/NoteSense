package repositories

import (
	"context"
	"log"
	"strings"

	"NoteSense/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NoteRepository will handle note data operations
type NoteRepository struct {
	db *gorm.DB
}

// KanbanColumns represents the different columns for organizing notes
type KanbanColumns struct {
	Backlog    []models.Note
	Todo       []models.Note
	InProgress []models.Note
	Done       []models.Note
}

func NewNoteRepository(db *gorm.DB) *NoteRepository {
	return &NoteRepository{db: db}
}

func (r *NoteRepository) Create(ctx context.Context, note *models.Note) error {
	if err := r.db.WithContext(ctx).Create(note).Error; err != nil {
		return err
	}
	return nil
}

func (r *NoteRepository) GetByUserID(ctx context.Context, userID string) ([]models.Note, error) {
	var notes []models.Note
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&notes).Error; err != nil {
		return nil, err
	}
	return notes, nil
}

func (r *NoteRepository) Update(ctx context.Context, note *models.Note) error {
	if err := r.db.WithContext(ctx).Save(note).Error; err != nil {
		return err
	}
	return nil
}

func (r *NoteRepository) Delete(noteID uuid.UUID, userID uuid.UUID) error {
	if err := r.db.Where("id = ? AND user_id = ?", noteID, userID).Delete(&models.Note{}).Error; err != nil {
		return err
	}
	return nil
}

func (r *NoteRepository) GetByID(noteID uuid.UUID, userID uuid.UUID) (*models.Note, error) {
	var note models.Note
	result := r.db.Where("id = ? AND user_id = ?", noteID, userID).First(&note)
	if result.Error != nil {

		if result.Error == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, result.Error
	}
	return &note, nil
}

func (r *NoteRepository) GetNotesByState(userID uuid.UUID) (map[string][]models.Note, error) {
	var notes []models.Note
	result := r.db.Where("user_id = ?", userID).Order("priority").Find(&notes)
	if result.Error != nil {
		return nil, result.Error
	}

	groupedNotes := make(map[string][]models.Note)
	for _, note := range notes {
		groupedNotes[note.Status] = append(groupedNotes[note.Status], note)
	}
	return groupedNotes, nil
}

func (r *NoteRepository) UpdateNoteState(noteID uuid.UUID, state string, priority int) error {
	return r.db.Model(&models.Note{}).
		Where("id = ?", noteID).
		Updates(map[string]interface{}{
			"state":    state,
			"priority": priority,
		}).Error
}

func (r *NoteRepository) SearchNotes(ctx context.Context, query string, categories []string, userID uuid.UUID) ([]models.Note, error) {
	var notes []models.Note

	// Base query
	tx := r.db.WithContext(ctx).Where("user_id = ?", userID)

	// Add text search condition
	if query != "" {
		searchQuery := "%" + query + "%"
		tx = tx.Where("title ILIKE ? OR content ILIKE ?", searchQuery, searchQuery)
	}

	// Filter by categories if provided
	if len(categories) > 0 {
		tx = tx.Where("? && categories", categories)
	}

	if err := tx.Find(&notes).Error; err != nil {
		return nil, err
	}

	return notes, nil
}

func (r *NoteRepository) GetKanbanNotes(userID string) (*KanbanColumns, error) {
	// Fetch notes for the user
	var notes []models.Note
	result := r.db.Where("user_id = ?", userID).Find(&notes)

	// Log total number of notes and any errors
	log.Printf("Total notes found: %d", len(notes))
	log.Printf("Database query error: %v", result.Error)

	if result.Error != nil {
		return nil, result.Error
	}

	// Initialize kanban columns
	kanbanNotes := &KanbanColumns{
		Backlog:    []models.Note{},
		Todo:       []models.Note{},
		InProgress: []models.Note{},
		Done:       []models.Note{},
	}

	// Categorize notes into columns
	for _, note := range notes {
		status := strings.TrimSpace(strings.ToLower(note.Status))

		// Log each note's details
		log.Printf("Note ID: %s, Title: %s, Status: %s", note.ID, note.Title, status)

		// Map notes to appropriate columns
		switch status {
		case "backlog":
			kanbanNotes.Backlog = append(kanbanNotes.Backlog, note)
		case "todo":
			kanbanNotes.Todo = append(kanbanNotes.Todo, note)
		case "in_progress", "inprogress", "in progress":
			kanbanNotes.InProgress = append(kanbanNotes.InProgress, note)
		case "done", "completed":
			kanbanNotes.Done = append(kanbanNotes.Done, note)
		}
	}

	return kanbanNotes, nil
}

// GetNotesMindmap retrieves notes and their connections for mindmap visualization
func (r *NoteRepository) GetNotesMindmap(ctx context.Context, userID uuid.UUID) (map[uuid.UUID][]uuid.UUID, error) {
	var notes []models.Note

	// Retrieve all notes for the user
	result := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&notes)

	if result.Error != nil {
		return nil, result.Error
	}

	// Create a map of note connections
	noteConnections := make(map[uuid.UUID][]uuid.UUID)
	for _, note := range notes {
		// Convert connected note IDs to UUIDs
		var connectedNoteIDs []uuid.UUID
		for _, idStr := range note.ConnectedNoteIDs {
			connID, err := uuid.Parse(idStr)
			if err == nil {
				connectedNoteIDs = append(connectedNoteIDs, connID)
			}
		}

		// Only add to map if there are connections
		if len(connectedNoteIDs) > 0 {
			noteConnections[note.ID] = connectedNoteIDs
		}
	}

	return noteConnections, nil
}
