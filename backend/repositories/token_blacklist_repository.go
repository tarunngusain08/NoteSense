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
	result := r.DB.WithContext(ctx).Model(&models.TokenBlacklist{}).
		Where("token_uuid = ?", tokenUUID).
		Count(&count)
	return count > 0, result.Error
}

func (r *TokenBlacklistRepository) CleanupExpiredTokens(ctx context.Context) error {
	return r.DB.WithContext(ctx).
		Where("expires_at < ?", time.Now()).
		Delete(&models.TokenBlacklist{}).Error
}
