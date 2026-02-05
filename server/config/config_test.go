package config

import (
	"os"
	"testing"
)

func TestGetEnv(t *testing.T) {
	key := "TEST_ENV_VAR"
	expected := "test_value"

	// Test fallback
	result := getEnv(key, "fallback")
	if result != "fallback" {
		t.Errorf("Expected fallback, got %s", result)
	}

	// Test existing variable
	os.Setenv(key, expected)
	defer os.Unsetenv(key)

	result = getEnv(key, "fallback")
	if result != expected {
		t.Errorf("Expected %s, got %s", expected, result)
	}
}

func TestLoadConfig(t *testing.T) {
	// Set some environment variables
	os.Setenv("PORT", "9999")
	os.Setenv("ENV", "test")
	defer os.Unsetenv("PORT")
	defer os.Unsetenv("ENV")

	cfg := LoadConfig()

	if cfg.Port != "9999" {
		t.Errorf("Expected Port 9999, got %s", cfg.Port)
	}
	if cfg.Env != "test" {
		t.Errorf("Expected Env test, got %s", cfg.Env)
	}
}
