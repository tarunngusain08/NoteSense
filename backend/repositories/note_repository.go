package repositories

import (
	"context"

	"NoteSense/models"

	"gorm.io/gorm"
)

// NoteRepository will handle note data operations
type NoteRepository struct {
	db *gorm.DB
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

func (r *NoteRepository) Delete(ctx context.Context, id, userID string) error {
	if err := r.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).Delete(&models.Note{}).Error; err != nil {
		return err
	}
	return nil
}

// Implement methods for note data operations
