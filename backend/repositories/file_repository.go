package repositories

import (
	"NoteSense/models"
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FileRepository struct {
	db *gorm.DB
}

func NewFileRepository(db *gorm.DB) *FileRepository {
	return &FileRepository{db: db}
}

func (r *FileRepository) Create(ctx context.Context, file *models.File) error {
	return r.db.Create(file).Error
}

func (r *FileRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.File, error) {
	var file models.File
	if err := r.db.First(&file, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *FileRepository) GetByNoteID(ctx context.Context, noteID uuid.UUID) ([]models.File, error) {
	var files []models.File
	if err := r.db.Where("note_id = ?", noteID).Find(&files).Error; err != nil {
		return nil, err
	}
	return files, nil
}
