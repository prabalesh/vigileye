package config

import (
	"os"
)

type Config struct {
	DatabaseURL string
	JWTSecret   string
	Port        string
	Env         string
}

func LoadConfig() Config {
	return Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://vigileye:password@localhost:5432/vigileye?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "default-secret-key-at-least-32-chars-long"),
		Port:        getEnv("PORT", "4000"),
		Env:         getEnv("ENV", "development"),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
