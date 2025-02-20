package repositories

import (
	"NoteSense/models"

	"gorm.io/gorm"
)

type FileMetadataRepository struct {
	db *gorm.DB
}

func NewFileMetadataRepository(db *gorm.DB) *FileMetadataRepository {
	return &FileMetadataRepository{db: db}
}

func (r *FileMetadataRepository) Create(metadata *models.FileMetadata) (*models.FileMetadata, error) {
	result := r.db.Create(metadata)
	return metadata, result.Error
}
