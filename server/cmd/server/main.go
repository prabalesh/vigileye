package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/prabalesh/vigileye/config"
	"github.com/prabalesh/vigileye/database"
	"github.com/prabalesh/vigileye/handlers"
	"github.com/prabalesh/vigileye/middleware"
	"github.com/rs/cors"
)

func main() {
	cfg := config.LoadConfig()

	// Connect to Database
	database.ConnectDB(cfg.DatabaseURL)
	// database.RunMigrations("database/migrations.sql")

	r := mux.NewRouter()

	// Public routes
	auth := r.PathPrefix("/api/auth").Subrouter()
	auth.HandleFunc("/register", handlers.Register).Methods("POST")
	auth.HandleFunc("/login", handlers.Login).Methods("POST")

	// API Key Protected routes (Ingestion)
	// We define this BEFORE the general /api prefix to ensure correct matching
	logRouter := r.PathPrefix("/api/log").Subrouter()
	logRouter.Use(middleware.RateLimitMiddleware)
	logRouter.Use(middleware.APIKeyMiddleware)
	logRouter.HandleFunc("", handlers.LogError).Methods("POST")

	// Protected routes (JWT - Dashboard)
	api := r.PathPrefix("/api").Subrouter()
	api.Use(middleware.AuthMiddleware(cfg.JWTSecret))

	api.HandleFunc("/auth/me", handlers.Me).Methods("GET")

	api.HandleFunc("/projects", handlers.GetProjects).Methods("GET")
	api.HandleFunc("/projects", handlers.CreateProject).Methods("POST")
	api.HandleFunc("/projects/{id:[0-9]+}", handlers.GetProject).Methods("GET")

	// Project Member routes
	memberRouter := api.PathPrefix("/projects/{id:[0-9]+}/members").Subrouter()
	memberRouter.HandleFunc("", handlers.GetProjectMembers).Methods("GET")
	memberRouter.HandleFunc("/check-last-admin/{user_id:[0-9]+}", handlers.CheckLastAdmin).Methods("GET")

	// Admin-only member routes
	adminMemberRouter := memberRouter.PathPrefix("").Subrouter()
	adminMemberRouter.Use(middleware.RequireAdmin)
	adminMemberRouter.HandleFunc("", handlers.InviteMember).Methods("POST")
	adminMemberRouter.HandleFunc("/{user_id:[0-9]+}", handlers.UpdateMemberRole).Methods("PATCH")
	adminMemberRouter.HandleFunc("/{user_id:[0-9]+}", handlers.RemoveMember).Methods("DELETE")

	api.HandleFunc("/projects/{id:[0-9]+}/environments", handlers.GetEnvironments).Methods("GET")
	api.HandleFunc("/projects/{id:[0-9]+}/environments", handlers.CreateEnvironment).Methods("POST")

	// Admin-only environment routes
	adminEnvRouter := api.PathPrefix("/projects/{id:[0-9]+}/environments/{env_id:[0-9]+}").Subrouter()
	adminEnvRouter.Use(middleware.RequireAdmin)
	adminEnvRouter.HandleFunc("", handlers.UpdateEnvironment).Methods("PATCH")
	adminEnvRouter.HandleFunc("", handlers.DeleteEnvironment).Methods("DELETE")
	adminEnvRouter.HandleFunc("/regenerate-key", handlers.RegenerateEnvironmentKey).Methods("POST")

	api.HandleFunc("/projects/{id:[0-9]+}/error-groups", handlers.GetErrorGroups).Methods("GET")
	api.HandleFunc("/projects/{id:[0-9]+}/error-groups/{group_id:[0-9]+}", handlers.GetErrorGroupDetail).Methods("GET")
	api.HandleFunc("/projects/{id:[0-9]+}/error-groups/{group_id:[0-9]+}/occurrences", handlers.GetErrorGroupOccurrences).Methods("GET")
	api.HandleFunc("/projects/{id:[0-9]+}/error-groups/{group_id:[0-9]+}/resolve", handlers.ResolveErrorGroup).Methods("PATCH")
	api.HandleFunc("/projects/{id:[0-9]+}/error-groups/{group_id:[0-9]+}/ignore", handlers.IgnoreErrorGroup).Methods("PATCH")
	api.HandleFunc("/projects/{id:[0-9]+}/error-groups/{group_id:[0-9]+}/reopen", handlers.ReopenErrorGroup).Methods("PATCH")

	api.HandleFunc("/projects/{id:[0-9]+}/errors", handlers.GetErrors).Methods("GET")
	api.HandleFunc("/projects/{id:[0-9]+}/errors/{error_id:[0-9]+}", handlers.GetErrorDetail).Methods("GET")
	api.HandleFunc("/projects/{id:[0-9]+}/errors/{error_id:[0-9]+}/resolve", handlers.ResolveError).Methods("PATCH")

	// CORS
	// Dashboard CORS
	dashboardCors := cors.New(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		Debug:            cfg.Env == "development",
	})

	// Ingestion CORS (Global)
	ingestionCors := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"POST", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "X-API-Key"},
		Debug:          cfg.Env == "development",
	})

	// Switch CORS based on path
	handler := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if strings.HasPrefix(req.URL.Path, "/api/log") {
			ingestionCors.Handler(r).ServeHTTP(w, req)
		} else {
			dashboardCors.Handler(r).ServeHTTP(w, req)
		}
	})

	fmt.Printf("Vigileye Server starting on port %s in %s mode...\n", cfg.Port, cfg.Env)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, handler))
}
