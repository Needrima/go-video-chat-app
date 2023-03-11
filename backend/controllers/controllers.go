package controllers

import (
	"encoding/json"
	"fmt"
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
	w.Header().Set("Access-Control-Allow-Origin", "*")
	log.Println("endpoint hit")

	roomID := Allroom.CreateRoom()
	log.Println(roomID)

	json.NewEncoder(w).Encode(map[string]string{
		"roomID": roomID,
	})
}

func JoinRoom(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")

	roomID := mux.Vars(r)["room_id"]
	if len(roomID) == 0 {
		log.Println("invalid id")
		return
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{
			"error": "something went wrong",
		})
		return
	}

	fmt.Println("adding connection to room with ID:", roomID)
	Allroom.AddToRoom(roomID, ws)

	go func(ws *websocket.Conn, id string) {
		for {
			msg := BroadCastMessage{}
			if err := ws.ReadJSON(&msg.msg); err != nil {
				log.Println("err reading from websocket connection:", err.Error())

				Allroom.DeleteParticipant(id, ws)

				BroadcastChan <- BroadCastMessage{
					roomID: id,
					msg: map[string]interface{}{
						"left": "a user left the chat",
					},
				}
				return
			}

			msg.conn = ws
			msg.roomID = roomID

			fmt.Println(msg)

			BroadcastChan <- msg
		}
	}(ws, roomID)

	BroadCastMessageToRoom()
}
