package controllers

import (
	"NoteSense/services" // Adjust the import path
	"encoding/json"
	"net/http"
)

// UserHandler holds the user service
type UserHandler struct {
	UserService *services.UserService
}

// SignUpHandler handles user sign up
func (h *UserHandler) SignUpHandler(w http.ResponseWriter, r *http.Request) {
	// Call the user service to handle sign up
	resp, err := h.UserService.SignUp(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Set content type and write response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

// LoginHandler handles user login
func (h *UserHandler) LoginHandler(w http.ResponseWriter, r *http.Request) {
	// Call the user service to handle login
	resp, err := h.UserService.Login(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Set content type and write response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}
