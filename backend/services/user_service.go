package services

import (
	"NoteSense/contracts"
	"NoteSense/models"
	"NoteSense/repositories"
	"NoteSense/utils"
	"context"
	"fmt"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
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

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("error hashing password: %v", err)
	}

	// Create user model
	user := models.User{
		ID:       uuid.New(),
		Email:    email,
		Password: string(hashedPassword),
		Name:     name,
	}

	// Create the user
	if err := s.UserRepo.Create(context.Background(), &user); err != nil {
		return nil, err
	}

	// Generate token
	tokenDetails, err := utils.GenerateTokenPair(user.ID)
	if err != nil {
		return nil, fmt.Errorf("error generating tokens: %v", err)
	}

	// Return response with token and user data
	return &contracts.SignUpResponse{
		Token: tokenDetails.AccessToken,
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

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(existingUser.Password), []byte(password)); err != nil {
		return nil, fmt.Errorf("invalid email or password")
	}

	// Generate token
	tokenDetails, err := utils.GenerateTokenPair(existingUser.ID)
	if err != nil {
		return nil, fmt.Errorf("error generating tokens: %v", err)
	}

	// Return response with token and user data
	return &contracts.LoginResponse{
		Token: tokenDetails.AccessToken,
		User:  *existingUser,
	}, nil
}
