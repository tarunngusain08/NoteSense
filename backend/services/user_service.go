package services

import (
	"NoteSense/models"
	"NoteSense/repositories"
	"context"
	"encoding/json"
	"net/http"
)

// UserService holds the user repository
type UserService struct {
	UserRepo *repositories.UserRepository
}

// NewUserService creates a new UserService
func NewUserService(repo *repositories.UserRepository) *UserService {
	return &UserService{UserRepo: repo}
}

// SignUp handles user registration logic
func (s *UserService) SignUp(r *http.Request) error {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		return err
	}
	// Validate user data here (e.g., check email format)
	return s.UserRepo.Create(context.Background(), &user)
}

// Login handles user login logic
func (s *UserService) Login(r *http.Request) (string, error) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		return "", err
	}
	existingUser, err := s.UserRepo.GetByEmail(context.Background(), user.Email)
	if err != nil || existingUser.Password != user.Password { // Add proper password hashing
		return "", err
	}
	// Generate a token (this is a placeholder)
	return "token", nil
}
