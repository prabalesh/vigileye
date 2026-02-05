package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"github.com/vigileye/vigileye/config"
	"github.com/vigileye/vigileye/database"
	"github.com/vigileye/vigileye/handlers"
	"github.com/vigileye/vigileye/middleware"
)

func main() {
	cfg := config.LoadConfig()

	// Connect to Database
	database.ConnectDB(cfg.DatabaseURL)
	database.RunMigrations("database/migrations.sql")

	r := mux.NewRouter()

	// Public routes
	auth := r.PathPrefix("/api/auth").Subrouter()
	auth.HandleFunc("/register", handlers.Register).Methods("POST")
	auth.HandleFunc("/login", handlers.Login).Methods("POST")

	// Protected routes (JWT)
	api := r.PathPrefix("/api").Subrouter()
	api.Use(middleware.AuthMiddleware(cfg.JWTSecret))

	api.HandleFunc("/auth/me", handlers.Me).Methods("GET")

	api.HandleFunc("/projects", handlers.GetProjects).Methods("GET")
	api.HandleFunc("/projects", handlers.CreateProject).Methods("POST")
	api.HandleFunc("/projects/{id:[0-9]+}", handlers.GetProject).Methods("GET")
	api.HandleFunc("/projects/{id:[0-9]+}/members", handlers.AddProjectMember).Methods("POST")
	api.HandleFunc("/projects/{id:[0-9]+}/members/{user_id:[0-9]+}", handlers.RemoveProjectMember).Methods("DELETE")

	api.HandleFunc("/projects/{id:[0-9]+}/errors", handlers.GetErrors).Methods("GET")
	api.HandleFunc("/projects/{id:[0-9]+}/errors/{error_id:[0-9]+}", handlers.GetErrorDetail).Methods("GET")
	api.HandleFunc("/projects/{id:[0-9]+}/errors/{error_id:[0-9]+}", handlers.ResolveError).Methods("PATCH")

	// API Key Protected routes
	logRouter := r.PathPrefix("/api/log").Subrouter()
	logRouter.Use(middleware.RateLimitMiddleware)
	logRouter.Use(middleware.APIKeyMiddleware)
	logRouter.HandleFunc("", handlers.LogError).Methods("POST")

	// CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"}, // Vite default and common alternatives
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "X-API-Key"},
		AllowCredentials: true,
		Debug:            cfg.Env == "development",
	})

	handler := c.Handler(r)

	fmt.Printf("Vigileye Server starting on port %s in %s mode...\n", cfg.Port, cfg.Env)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, handler))
}
