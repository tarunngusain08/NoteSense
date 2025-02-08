package controllers

import (
	"net/http"

	"NoteSense/services" // Adjust the import path
)

// UserHandler holds the user service
type UserHandler struct {
	UserService *services.UserService
}

// SignUpHandler handles user sign up
func (h *UserHandler) SignUpHandler(w http.ResponseWriter, r *http.Request) {
	// Call the user service to handle sign up
	err := h.UserService.SignUp(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

// LoginHandler handles user login
func (h *UserHandler) LoginHandler(w http.ResponseWriter, r *http.Request) {
	// Call the user service to handle login
	token, err := h.UserService.Login(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	w.Write([]byte(token))
}
