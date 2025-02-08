package services

import (
	"NoteSense/models"
	"NoteSense/repositories"
	"context"
	"encoding/json"
	"fmt"
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

// SignUpResponse represents the response for signup
type SignUpResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// SignUp handles user registration logic
func (s *UserService) SignUp(r *http.Request) (*SignUpResponse, error) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		return nil, err
	}

	// Validate user data
	if user.Email == "" || user.Password == "" || user.Name == "" {
		return nil, fmt.Errorf("email, password, and name are required")
	}

	// Create the user
	if err := s.UserRepo.Create(context.Background(), &user); err != nil {
		return nil, err
	}

	// Generate token (using a simple placeholder for now)
	token := "token" // Replace with proper JWT token generation

	// Return response with token and user data
	return &SignUpResponse{
		Token: token,
		User:  user,
	}, nil
}

// LoginResponse represents the response for login
type LoginResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// Login handles user login logic
func (s *UserService) Login(r *http.Request) (*LoginResponse, error) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		return nil, err
	}

	existingUser, err := s.UserRepo.GetByEmail(context.Background(), user.Email)
	if err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	if existingUser.Password != user.Password { // Add proper password hashing later
		return nil, fmt.Errorf("invalid email or password")
	}

	// Generate token (using a simple placeholder for now)
	token := "token" // Replace with proper JWT token generation

	// Return response with token and user data
	return &LoginResponse{
		Token: token,
		User:  *existingUser,
	}, nil
}
