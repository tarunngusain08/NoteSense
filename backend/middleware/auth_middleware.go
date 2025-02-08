package middleware

import (
	"NoteSense/repositories"
	"NoteSense/utils"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type AuthMiddleware struct {
	TokenBlacklistRepo *repositories.TokenBlacklistRepository
}

func NewAuthMiddleware(repo *repositories.TokenBlacklistRepository) *AuthMiddleware {
	return &AuthMiddleware{TokenBlacklistRepo: repo}
}

func (m *AuthMiddleware) Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is missing"})
			c.Abort()
			return
		}

		// Check if the header starts with "Bearer "
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Verify the token
		token, err := utils.VerifyToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Extract token metadata
		userId, tokenUUID, err := utils.ExtractTokenMetadata(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token metadata"})
			c.Abort()
			return
		}

		// Check if token is blacklisted
		isBlacklisted, err := m.TokenBlacklistRepo.IsTokenBlacklisted(c, tokenUUID)
		if err != nil || isBlacklisted {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token has been invalidated"})
			c.Abort()
			return
		}

		// Set user ID in context for further use
		c.Set("user_id", userId)
		c.Next()
	}
}

func (m *AuthMiddleware) Logout() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		token, err := utils.VerifyToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Extract token metadata
		userId, tokenUUID, err := utils.ExtractTokenMetadata(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token metadata"})
			c.Abort()
			return
		}

		// Get token expiration
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		exp, ok := claims["exp"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token expiration"})
			c.Abort()
			return
		}

		// Blacklist the token
		err = m.TokenBlacklistRepo.BlacklistToken(c, userId, tokenUUID, time.Unix(int64(exp), 0))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to blacklist token"})
			c.Abort()
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
		c.Abort()
	}
}

func GetUserIDFromContext(c *gin.Context) (uuid.UUID, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, false
	}

	return userID.(uuid.UUID), true
}
