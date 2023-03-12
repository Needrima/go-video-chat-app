package controllers

import (
	"math/rand"
	"regexp"
	"time"
)

// generateID generats a new ID for a new room
func generateID() string {
	var id string
	chars := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"

	rand.Seed(time.Now().UnixNano())

	for i := 0; i < 6; i++ {
		char := chars[rand.Intn(len(chars))]
		id += string(char)
	}

	return id
}

func validateID(id string) bool {
	if !regexp.MustCompile(`^[a-zA-Z0-9]{6}$`).MatchString(id) {
		return false
	}

	_, ok := Allroom.rooms[id]
	return ok
}
