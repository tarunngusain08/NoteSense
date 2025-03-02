package middleware

import (
	"NoteSense/models"
	"NoteSense/repositories"
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/google/uuid"
)

// AuthMiddleware handles authentication
type AuthMiddleware struct {
	UserRepo           *repositories.UserRepository
	TokenBlacklistRepo *repositories.TokenBlacklistRepository
}

// NewAuthMiddleware creates a new AuthMiddleware
func NewAuthMiddleware(userRepo *repositories.UserRepository, tokenBlacklistRepo *repositories.TokenBlacklistRepository) *AuthMiddleware {
	return &AuthMiddleware{
		UserRepo:           userRepo,
		TokenBlacklistRepo: tokenBlacklistRepo,
	}
}

// Authenticate validates the token and returns the authenticated user
func (m *AuthMiddleware) Authenticate(r *http.Request) (*models.User, error) {
	// Get the Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		log.Println("no authorization token provided")
		return nil, fmt.Errorf("no authorization token provided")
	}

	// Extract the token
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		log.Println("no authorization token provided")
		return nil, fmt.Errorf("invalid authorization header format")
	}
	tokenString := tokenParts[1]

	// Check if token is blacklisted
	isBlacklisted, err := m.TokenBlacklistRepo.IsTokenBlacklisted(r.Context(), tokenString)
	if err != nil {
		log.Printf("Error checking token blacklist: %v", err)
		return nil, fmt.Errorf("error checking token blacklist: %w", err)
	}
	if isBlacklisted {
		log.Println("Token is blacklisted")
		return nil, fmt.Errorf("token is blacklisted")
	}

	// Parse and validate the token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			log.Println("invalid signing method")
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(os.Getenv("JWT_SECRET")), nil // Use the secret key from the environment
	})

	if err != nil {
		// log.Println("invalid token")
		// fmt.Println("invalid token: ", err.Error())
		return nil, fmt.Errorf("invalid token: %v", err)
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		// Get user ID from claims
		userID, ok := claims["user_id"].(string)
		if !ok {
			log.Println("invalid user ID in token")
			return nil, fmt.Errorf("invalid user ID in token")
		}

		// Get user from database
		user, err := m.UserRepo.FindByID(userID)
		if err != nil {
			log.Println("user not found")
			return nil, fmt.Errorf("user not found")
		}

		return user, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// ValidateTokenMiddleware is a middleware function compatible with Gorilla Mux
func (m *AuthMiddleware) ValidateTokenMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip authentication for signup and login routes
		if r.URL.Path == "/signup" || r.URL.Path == "/login" {
			next.ServeHTTP(w, r)
			return
		}

		// Authenticate the request
		user, err := m.Authenticate(r)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Add user to context
		ctx := context.WithValue(r.Context(), "user", user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// BlacklistToken adds a token to the blacklist
func (m *AuthMiddleware) BlacklistToken(token string) error {
	log.Println("Starting token blacklist process")
	// Parse the token to get expiry time and user ID
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil {
		log.Printf("Error parsing token: %v", err)
		return fmt.Errorf("invalid token: %v", err)
	}

	claims, ok := parsedToken.Claims.(jwt.MapClaims)
	if !ok || !parsedToken.Valid {
		log.Println("Invalid token claims")
		return fmt.Errorf("invalid token claims")
	}

	userID, ok := claims["user_id"].(string)
	if !ok {
		log.Println("Invalid user ID in token")
		return fmt.Errorf("invalid user ID in token")
	}

	// Convert user ID to UUID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		log.Printf("Invalid user ID format: %v", err)
		return fmt.Errorf("invalid user ID format: %v", err)
	}

	// Get expiry time from claims
	exp, ok := claims["exp"].(float64)
	if !ok {
		log.Println("Invalid expiry time in token")
		return fmt.Errorf("invalid expiry time in token")
	}

	expiresAt := time.Unix(int64(exp), 0)
	log.Printf("Blacklisting token for user %s with expiry %v", userUUID, expiresAt)

	// Add token to blacklist
	err = m.TokenBlacklistRepo.BlacklistToken(context.Background(), userUUID, token, expiresAt)
	if err != nil {
		log.Printf("Error blacklisting token: %v", err)
	}
	return err
}
