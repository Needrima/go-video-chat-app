package controllers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func CreateRoom(w http.ResponseWriter, r *http.Request) {
	roomID := createRoom()

	mu.Lock()
	rooms[roomID] = []*websocket.Conn{}
	mu.Unlock()

	json.NewEncoder(w).Encode(map[string]string{
		"roomID": roomID,
	})
}

func JoinRoom(w http.ResponseWriter, r *http.Request) {
	roomID := mux.Vars(r)["room_id"]

	if len(roomID) != 6 {
		json.NewEncoder(w).Encode(map[string]string{
			"error": "invalid room id",
		})
		return
	}

	room, ok := rooms[roomID]
	if !ok {
		json.NewEncoder(w).Encode(map[string]string{
			"error": "invalid room id",
		})
		return
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{
			"error": "something went wrong",
		})
		return
	}

	room = append(room, ws)

	go func(ws *websocket.Conn, roomId string) {
		for {
			msg := BroadCastMessage{}
			if err := ws.ReadJSON(&msg.msg); err != nil {
				log.Println("err reading from websocket connection:", err.Error())
				ws.Close()
				return
			}

			msg.conn = ws
			msg.roomID = roomId

			BroadcastChan <- msg
		}
	}(ws, roomID)

}
