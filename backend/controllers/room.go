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

// deleteFromRoom deletes connection ws from room with id roomId
func deleteFromRoom(ws *websocket.Conn, roomId string) {
	room := rooms[roomId]
	var r []*websocket.Conn
	for _, conn := range room {
		if conn != ws {
			r = append(r, conn)
		}
	}
	
	mu.Lock()
	rooms[roomId] = r
	mu.Unlock()
}

// BroadCastMessageToRoom listens for any message in BraodcastChan and broadcasts the message to the appropriate room
//. See type BroadCastMessage to know the message formats been sent to BroadcastChan
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
