package controllers

import (
	"NoteSense/contracts"
	"NoteSense/services"
	"encoding/json"
	"net/http"
)

// UserHandler holds the user service
type UserHandler struct {
	UserService *services.UserService
}

// SignUpHandler handles user sign up
func (h *UserHandler) SignUpHandler(w http.ResponseWriter, r *http.Request) {
	// Decode request body
	var req contracts.UserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Call the user service to handle sign up
	resp, err := h.UserService.SignUp(req.Email, req.Password, req.Name)
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
	// Decode request body
	var req contracts.UserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Call the user service to handle login
	resp, err := h.UserService.Login(req.Email, req.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Set content type and write response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}
