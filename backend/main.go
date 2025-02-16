package main

import (
	"context"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv" // Import the godotenv package
	"gorm.io/driver/postgres"  // Import GORM PostgreSQL driver
	"gorm.io/gorm"             // Import GORM

	"NoteSense/controllers"
	"NoteSense/middleware"
	"NoteSense/models" // Import models for migration
	"NoteSense/repositories"
	"NoteSense/services"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	_ "github.com/lib/pq" // PostgreSQL driver
	// other necessary imports...
)

// connectWithRetry attempts to connect to the database with exponential backoff and context
func connectWithRetry(ctx context.Context, connectionString string, maxRetries int) (*gorm.DB, error) {
	var db *gorm.DB
	var err error

	for attempt := 0; attempt < maxRetries; attempt++ {
		// Check if context is cancelled
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
			// Continue with connection attempt
		}

		// Configure connection with timeout
		dialector := postgres.Open(connectionString)
		db, err = gorm.Open(dialector, &gorm.Config{})

		if err == nil {
			sqlDB, err := db.DB()
			if err != nil {
				log.Printf("Error getting database connection: %v", err)
				continue
			}

			// Set connection timeout using sqlDB
			sqlDB.SetConnMaxLifetime(10 * time.Second)
			sqlDB.SetConnMaxIdleTime(5 * time.Second)

			// Test the database connection
			if err := sqlDB.Ping(); err != nil {
				log.Printf("Database ping failed: %v", err)
				time.Sleep(time.Duration(math.Pow(2, float64(attempt))) * time.Second)
				continue
			}

			log.Println("Database connection established successfully")
			return db, nil
		}

		log.Printf("Database connection attempt %d failed: %v", attempt+1, err)

		// Exponential backoff
		backoffTime := time.Duration(math.Pow(2, float64(attempt))) * time.Second
		time.Sleep(backoffTime)
	}

	return nil, fmt.Errorf("failed to connect to database after %d attempts: %v", maxRetries, err)
}

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

	// Create a context with cancellation
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// Initialize GORM DB connection with retry and context
	db, err := connectWithRetry(ctx, connectionString, 5)
	if err != nil {
		log.Fatalf("Critical error: Unable to establish database connection: %v", err)
	}
	defer func() {
		sqlDB, err := db.DB()
		if err != nil {
			log.Println("Error getting database connection:", err)
			return
		}
		sqlDB.Close()
	}()

	// Automigrate the models
	if err := db.AutoMigrate(&models.User{}, &models.Note{}, &models.TokenBlacklist{}); err != nil {
		log.Fatal("Error during migration:", err)
	}
	log.Println("Database migration completed")

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	noteRepo := repositories.NewNoteRepository(db)
	tokenBlacklistRepo := repositories.NewTokenBlacklistRepository(db)

	// Initialize services
	userService := services.NewUserService(userRepo)
	noteService := services.NewNoteService(noteRepo)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(userRepo, tokenBlacklistRepo)

	// Initialize handlers
	userHandler := &controllers.UserHandler{
		UserService:          userService,
		AuthorizationService: authMiddleware,
	}
	noteHandler := &controllers.NoteHandler{NoteService: noteService}

	// Set up the router
	r := mux.NewRouter()

	// Apply authentication middleware globally
	r.Use(authMiddleware.ValidateTokenMiddleware)

	// User routes
	r.HandleFunc("/signup", userHandler.SignUpHandler).Methods("POST")
	r.HandleFunc("/login", userHandler.LoginHandler).Methods("POST")
	r.HandleFunc("/logout", userHandler.LogoutHandler).Methods("POST")

	// Note routes
	r.HandleFunc("/api/notes", noteHandler.CreateNoteHandler).Methods("POST")
	r.HandleFunc("/api/notes", noteHandler.GetNotesHandler).Methods("GET") // List all notes
	r.HandleFunc("/api/notes/search", noteHandler.SearchNotesHandler).Methods("POST")
	r.HandleFunc("/api/notes/kanban", noteHandler.GetKanbanNotesHandler).Methods("GET")
	r.HandleFunc("/api/notes/kanban/note/{id}", noteHandler.UpdateNoteStateAndPriorityHandler).Methods("PATCH")

	r.HandleFunc("/api/notes/{id}", noteHandler.GetNoteHandler).Methods("GET") // Get single note
	r.HandleFunc("/api/notes/{id}", noteHandler.UpdateNoteHandler).Methods("PATCH")
	r.HandleFunc("/api/notes/{id}", noteHandler.DeleteNoteHandler).Methods("DELETE")

	// Enable CORS with more permissive settings
	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
	)

	// Use structured logging
	log.Printf("Starting server on :8080")
	log.Printf("Registered routes:")
	log.Printf("  - POST /signup")
	log.Printf("  - POST /login")
	log.Printf("  - POST /logout")
	log.Printf("  - POST /api/notes")
	log.Printf("  - GET /api/notes")
	log.Printf("  - PATCH /api/notes/{id}")
	log.Printf("  - DELETE /api/notes/{id}")
	log.Printf("  - POST /api/notes/search")
	log.Printf("  - GET /api/notes/kanban")

	if err := http.ListenAndServe(":8080", corsHandler(r)); err != nil {
		log.Fatal("Error starting server:", err)
	}
}
