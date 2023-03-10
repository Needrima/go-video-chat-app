package controllers

import (
	"math/rand"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type BroadCastMessage struct {
	msg    map[string]string
	roomID string
	conn   *websocket.Conn
}

var (
	rooms         = map[string][]*websocket.Conn{}
	mu            *sync.Mutex
	BroadcastChan chan (BroadCastMessage)
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

func BroadCastMessageToRoom() {
	for {
		msg := <-BroadcastChan
		room := rooms[msg.roomID]
		for _, conn := range room {
			if conn != msg.conn {
				conn.WriteJSON(msg.msg)
			}
		}
	}
}
