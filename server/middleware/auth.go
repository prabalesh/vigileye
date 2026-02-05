package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/prabalesh/vigileye/database"
	"github.com/prabalesh/vigileye/utils"
)

type contextKey string

const UserIDKey contextKey = "user_id"
const ProjectIDKey contextKey = "project_id"

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

		var projectID int
		err := database.DB.QueryRow("SELECT id FROM projects WHERE api_key = $1", apiKey).Scan(&projectID)
		if err != nil {
			http.Error(w, "Invalid API Key", http.StatusForbidden)
			return
		}

		ctx := context.WithValue(r.Context(), ProjectIDKey, projectID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
