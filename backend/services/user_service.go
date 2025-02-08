package services

import (
	"NoteSense/contracts"
	"NoteSense/models"
	"NoteSense/repositories"
	"context"
	"fmt"

	"github.com/google/uuid"
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
func (s *UserService) SignUp(email, password, name string) (*contracts.SignUpResponse, error) {
	// Validate user data
	if email == "" || password == "" {
		return nil, fmt.Errorf("email and password are required")
	}

	// Create user model
	user := models.User{
		ID:       uuid.New(),
		Email:    email,
		Password: password, // TODO: Add password hashing
		Name:     name,
	}

	// Create the user
	if err := s.UserRepo.Create(context.Background(), &user); err != nil {
		return nil, err
	}

	// Generate token (using a simple placeholder for now)
	token := "token" // Replace with proper JWT token generation

	// Return response with token and user data
	return &contracts.SignUpResponse{
		Token: token,
		User:  user,
	}, nil
}

// Login handles user login logic
func (s *UserService) Login(email, password string) (*contracts.LoginResponse, error) {
	// Validate input
	if email == "" || password == "" {
		return nil, fmt.Errorf("email and password are required")
	}

	// Find user by email
	existingUser, err := s.UserRepo.GetByEmail(context.Background(), email)
	if err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Check password (simple comparison for now, replace with proper hashing)
	if existingUser.Password != password {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Generate token (using a simple placeholder for now)
	token := "token" // Replace with proper JWT token generation

	// Return response with token and user data
	return &contracts.LoginResponse{
		Token: token,
		User:  *existingUser,
	}, nil
}
