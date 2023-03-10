package controllers

import (
	"math/rand"
	"time"
)

func createRoom() string {
	var id string
	chars := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"

	rand.Seed(time.Now().UnixNano())

	for i := 0; i < 6; i++ {
		char := chars[rand.Intn(len(chars))]
		id += string(char)
	}

	return id
}
