package services

import (
	"NoteSense/models"
	"NoteSense/repositories"
	"NoteSense/services/ocr"
	"NoteSense/services/upload"
	"context"
	"fmt"
	"mime/multipart"

	"github.com/google/uuid"
)

type FileService struct {
	FileRepo  *repositories.FileRepository
	uploaders map[models.FileType]upload.Uploader
}

func NewFileService(repo *repositories.FileRepository) *FileService {
	ocrService := ocr.NewOCRService()

	return &FileService{
		FileRepo: repo,
		uploaders: map[models.FileType]upload.Uploader{
			models.ImageFile: upload.NewImageUploader(ocrService),
			models.VideoFile: upload.NewVideoUploader(),
			// Temporarily remove unsupported file types until uploaders are implemented
			// models.AudioFile:    upload.NewAudioUploader(),
			// models.DocumentFile: upload.NewDocumentUploader(),
		},
	}
}

func (s *FileService) UploadFile(file *multipart.FileHeader, fileType models.FileType, userID uuid.UUID) (*models.File, error) {
	uploader, exists := s.uploaders[fileType]
	if !exists {
		return nil, fmt.Errorf("unsupported file type")
	}

	uploadedFile, err := uploader.Upload(file, userID)
	if err != nil {
		return nil, err
	}

	if err := s.FileRepo.Create(context.Background(), uploadedFile); err != nil {
		return nil, err
	}

	return uploadedFile, nil
}
