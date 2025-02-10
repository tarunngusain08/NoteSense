package repositories

import (
	"context"
	"NoteSense/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TokenBlacklistRepository struct {
	DB *gorm.DB
}

func NewTokenBlacklistRepository(db *gorm.DB) *TokenBlacklistRepository {
	return &TokenBlacklistRepository{DB: db}
}

func (r *TokenBlacklistRepository) BlacklistToken(ctx context.Context, userID uuid.UUID, tokenUUID string, expiresAt time.Time) error {
	tokenBlacklist := models.TokenBlacklist{
		UserID:    userID,
		TokenUUID: tokenUUID,
		ExpiresAt: expiresAt,
	}
	return r.DB.WithContext(ctx).Create(&tokenBlacklist).Error
}

func (r *TokenBlacklistRepository) IsTokenBlacklisted(ctx context.Context, tokenUUID string) (bool, error) {
	var count int64
	
	// Use a background context with a timeout to prevent context cancellation issues
	queryCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result := r.DB.WithContext(queryCtx).Model(&models.TokenBlacklist{}).
		Where("token_uuid = ?", tokenUUID).
		Count(&count)

	// Check for context cancellation or other errors
	if result.Error != nil {
		// Log the error for debugging
		return false, result.Error
	}

	return count > 0, nil
}

func (r *TokenBlacklistRepository) CleanupExpiredTokens(ctx context.Context) error {
	return r.DB.WithContext(ctx).
		Where("expires_at < ?", time.Now()).
		Delete(&models.TokenBlacklist{}).Error
}
