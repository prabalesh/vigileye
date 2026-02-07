package middleware

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"github.com/prabalesh/vigileye/database"
	"github.com/prabalesh/vigileye/utils"
)

type contextKey string

const UserIDKey contextKey = "user_id"
const ProjectIDKey contextKey = "project_id"
const EnvironmentIDKey contextKey = "environment_id"

func AuthMiddleware(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var tokenString string

			// Try to get token from Authorization header first
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			}

			// If no header, try to get from cookie
			if tokenString == "" {
				cookie, err := r.Cookie("vigileye_token")
				if err == nil {
					tokenString = cookie.Value
				}
			}

			if tokenString == "" {
				http.Error(w, "Authentication required", http.StatusUnauthorized)
				return
			}

			userID, err := utils.VerifyJWT(tokenString, jwtSecret)
			if err != nil {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func APIKeyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKey := r.Header.Get("X-API-Key")
		if apiKey == "" {
			http.Error(w, "X-API-Key header required", http.StatusForbidden)
			return
		}

		var projectID, environmentID int
		err := database.DB.QueryRow(`
			SELECT project_id, id FROM environments 
			WHERE api_key = $1 AND is_active = TRUE
		`, apiKey).Scan(&projectID, &environmentID)

		if err != nil {
			http.Error(w, "Invalid API Key", http.StatusForbidden)
			return
		}

		ctx := context.WithValue(r.Context(), ProjectIDKey, projectID)
		ctx = context.WithValue(ctx, EnvironmentIDKey, environmentID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(UserIDKey).(int)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		vars := mux.Vars(r)
		projectID, _ := strconv.Atoi(vars["id"])
		if projectID == 0 {
			projectID, _ = strconv.Atoi(vars["projectId"])
		}
		if projectID == 0 {
			// Try to get from context if not in URL
			if pid, ok := r.Context().Value(ProjectIDKey).(int); ok {
				projectID = pid
			}
		}

		if projectID == 0 {
			http.Error(w, "Project ID required", http.StatusBadRequest)
			return
		}

		var role string
		err := database.DB.QueryRow(`
			SELECT role FROM project_members 
			WHERE project_id = $1 AND user_id = $2
			UNION
			SELECT 'admin' as role FROM projects
			WHERE id = $1 AND owner_id = $2
		`, projectID, userID).Scan(&role)

		if err != nil {
			http.Error(w, "Access denied", http.StatusForbidden)
			return
		}

		if role != "admin" {
			http.Error(w, "Admin access required", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}
