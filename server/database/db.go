package database

import (
	"database/sql"
	"log"
	"os"
	"strings"

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

	log.Printf("✅ Successfully connected to database")
}

func RunMigrations(migrationsDir string) {
	// 1. Create schema_migrations table if it doesn't exist
	_, err := DB.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version_name TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ DEFAULT NOW()
		)
	`)
	if err != nil {
		log.Fatalf("Error creating schema_migrations table: %v", err)
	}

	// 2. Read all files in migrations directory
	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Fatalf("Error reading migrations directory: %v", err)
	}

	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".sql") {
			continue
		}

		versionName := file.Name()

		// 3. Check if migration was already applied
		var exists bool
		err = DB.QueryRow("SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version_name = $1)", versionName).Scan(&exists)
		if err != nil {
			log.Fatalf("Error checking migration status: %v", err)
		}

		if exists {
			continue
		}

		// 4. Apply migration
		log.Printf("📦 Applying migration: %s", versionName)
		filePath := migrationsDir + "/" + versionName
		content, err := os.ReadFile(filePath)
		if err != nil {
			log.Fatalf("Error reading migration file %s: %v", versionName, err)
		}

		// Use a transaction for each migration file to be safe
		tx, err := DB.Begin()
		if err != nil {
			log.Fatalf("Error starting transaction for %s: %v", versionName, err)
		}

		_, err = tx.Exec(string(content))
		if err != nil {
			tx.Rollback()
			log.Fatalf("Error running migration %s: %v", versionName, err)
		}

		_, err = tx.Exec("INSERT INTO schema_migrations (version_name) VALUES ($1)", versionName)
		if err != nil {
			tx.Rollback()
			log.Fatalf("Error recording migration %s: %v", versionName, err)
		}

		err = tx.Commit()
		if err != nil {
			log.Fatalf("Error committing migration %s: %v", versionName, err)
		}
	}

	log.Printf("✅ Migrations completed successfully")
}
