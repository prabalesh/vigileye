package utils

import (
	"testing"
)

func TestHashPassword(t *testing.T) {
	password := "testpassword123"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	if hash == password {
		t.Error("Hash should not be equal to password")
	}

	if !CheckPasswordHash(password, hash) {
		t.Error("Password check should succeed")
	}

	if CheckPasswordHash("wrongpassword", hash) {
		t.Error("Password check should fail for wrong password")
	}
}
