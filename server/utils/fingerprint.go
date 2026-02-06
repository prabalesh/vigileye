package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"regexp"
	"strings"
)

func GenerateErrorFingerprint(message, stack, url string) string {
	// Normalize message (remove dynamic data)
	normalizedMsg := NormalizeMessage(message)

	// Get first 10 lines of stack trace
	stackLines := strings.Split(stack, "\n")
	relevantStack := ""
	limit := 10
	if len(stackLines) > limit {
		relevantStack = strings.Join(stackLines[:limit], "\n")
	} else {
		relevantStack = stack
	}

	// Combine for fingerprint
	data := normalizedMsg + relevantStack + url

	// Hash it
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

func NormalizeMessage(msg string) string {
	// Remove UUIDs
	msg = regexp.MustCompile(`(?i)[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}`).ReplaceAllString(msg, "UUID")

	// Remove hex strings
	msg = regexp.MustCompile(`(?i)0x[a-f0-9]+`).ReplaceAllString(msg, "0xHEX")

	// Remove numbers: "User 123" → "User X"
	msg = regexp.MustCompile(`\d+`).ReplaceAllString(msg, "X")

	return strings.TrimSpace(msg)
}
