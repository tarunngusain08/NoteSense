package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv" // Import the godotenv package
	"gorm.io/driver/postgres"  // Import GORM PostgreSQL driver
	"gorm.io/gorm"             // Import GORM

	"NoteSense/controllers"
	"NoteSense/models" // Import models for migration
	"NoteSense/repositories"
	"NoteSense/services"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	_ "github.com/lib/pq" // PostgreSQL driver
	// other necessary imports...
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")

	connectionString := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", dbHost, dbPort, dbUser, dbPassword, dbName)

	// Initialize GORM DB connection
	db, err := gorm.Open(postgres.Open(connectionString), &gorm.Config{})
	if err != nil {
		log.Fatal("Error connecting to the database:", err)
	}
	log.Println("Database connection established")

	// Automigrate the models
	if err := db.AutoMigrate(&models.User{}, &models.Note{}); err != nil {
		log.Fatal("Error during migration:", err)
	}
	log.Println("Database migration completed")

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	noteRepo := repositories.NewNoteRepository(db)

	// Initialize services
	userService := services.NewUserService(userRepo)
	noteService := services.NewNoteService(noteRepo)

	// Initialize handlers
	userHandler := &controllers.UserHandler{UserService: userService}
	noteHandler := &controllers.NoteHandler{NoteService: noteService}

	// Set up the router
	r := mux.NewRouter()

	// User routes
	r.HandleFunc("/signup", userHandler.SignUpHandler).Methods("POST")
	r.HandleFunc("/login", userHandler.LoginHandler).Methods("POST")

	// Note routes
	r.HandleFunc("/api/notes", noteHandler.CreateNoteHandler).Methods("POST")
	r.HandleFunc("/api/notes", noteHandler.GetNoteHandler).Methods("GET")
	r.HandleFunc("/api/notes/{id}", noteHandler.UpdateNoteHandler).Methods("PUT")
	r.HandleFunc("/api/notes/{id}", noteHandler.DeleteNoteHandler).Methods("DELETE")


	// Enable CORS with more permissive settings
	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
	)

	log.Println("Starting server on :8080")
	log.Println("Routes:")
	log.Println("  POST /signup")
	log.Println("  POST /login")
	log.Println("  POST /notes")
	log.Println("  GET /notes")
	log.Println("  PUT /notes/{id}")
	log.Println("  DELETE /notes/{id}")

	if err := http.ListenAndServe(":8080", corsHandler(r)); err != nil {
		log.Fatal("Error starting server:", err)
	}
}
