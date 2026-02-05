package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func ConnectDB(databaseURL string) {
	var err error
	DB, err = sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatalf("Error opening database: %v", err)
	}

	err = DB.Ping()
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}

	fmt.Println("Successfully connected to database")
}

func RunMigrations(migrationFile string) {
	content, err := os.ReadFile(migrationFile)
	if err != nil {
		log.Fatalf("Error reading migration file: %v", err)
	}

	_, err = DB.Exec(string(content))
	if err != nil {
		log.Fatalf("Error running migrations: %v", err)
	}

	fmt.Println("Migrations completed successfully")
}
