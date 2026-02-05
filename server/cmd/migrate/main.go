package main

import (
	"log"

	"github.com/prabalesh/vigileye/config"
	"github.com/prabalesh/vigileye/database"
)

func main() {
	cfg := config.LoadConfig()

	database.ConnectDB(cfg.DatabaseURL)

	log.Println("Running migrations...")
	database.RunMigrations("database/migrations.sql")
	log.Println("✅ Migrations completed successfully")
}
