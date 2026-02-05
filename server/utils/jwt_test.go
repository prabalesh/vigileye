package utils

import (
	"testing"
)

func TestJWT(t *testing.T) {
	userID := 123
	secret := "test-secret-at-least-32-chars-long"

	token, err := GenerateJWT(userID, secret)
	if err != nil {
		t.Fatalf("Failed to generate JWT: %v", err)
	}

	if token == "" {
		t.Fatal("Token should not be empty")
	}

	parsedID, err := VerifyJWT(token, secret)
	if err != nil {
		t.Fatalf("Failed to verify JWT: %v", err)
	}

	if parsedID != userID {
		t.Errorf("Expected userID %d, got %d", userID, parsedID)
	}

	// Test invalid secret
	_, err = VerifyJWT(token, "wrong-secret")
	if err == nil {
		t.Error("Expected error with wrong secret, got nil")
	}
}
