package contracts

import "NoteSense/models"

// UserRequest represents the structure for user signup/login requests
type UserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name,omitempty"`
}

// SignUpResponse represents the response for signup
type SignUpResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// LoginResponse represents the response for login
type LoginResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}
