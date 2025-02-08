package contracts

import (
	"NoteSense/models"
	"context"
)

type NoteRepository interface {
	Create(ctx context.Context, note *models.Note) error
	GetByUserID(ctx context.Context, userID string) ([]models.Note, error)
	GetByID(ctx context.Context, noteID int, userID string) (*models.Note, error)
	Update(ctx context.Context, note *models.Note) error
	Delete(ctx context.Context, id, userID string) error
}
