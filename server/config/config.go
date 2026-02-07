package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL            string
	JWTSecret              string
	Port                   string
	Env                    string
	AllowedOrigins         []string
	TelegramHelperBotToken string
	BaseURL                string
}

func LoadConfig() Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, reading from system environment")
	}

	return Config{
		DatabaseURL:            getEnv("DATABASE_URL", "postgres://vigileye:password@localhost:5432/vigileye?sslmode=disable"),
		JWTSecret:              getEnv("JWT_SECRET", "default-secret-key-at-least-32-chars-long"),
		Port:                   getEnv("PORT", "4000"),
		Env:                    getEnv("ENV", "development"),
		AllowedOrigins:         parseCommaSeparated(getEnv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")),
		TelegramHelperBotToken: getEnv("TELEGRAM_HELPER_BOT_TOKEN", ""),
		BaseURL:                getEnv("BASE_URL", "http://localhost:5173"),
	}
}

func parseCommaSeparated(s string) []string {
	if s == "" {
		return []string{}
	}
	parts := strings.Split(s, ",")
	for i := range parts {
		parts[i] = strings.TrimSpace(parts[i])
	}
	return parts
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
