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
	if !validateID(roomID) {
		log.Println("connecion refused, invalid id")
		return
	}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{
			"error": "something went wrong",
		})
		return
	}

	if err := Allroom.AddToRoom(roomID, ws); err != nil {
		ws.WriteJSON(map[string]interface{}{
			"type":    "unauthorized",
			"message": err.Error(),
		})
		return
	}

	go func(ws *websocket.Conn, id string) {
		for {
			msg := BroadCastMessage{}
			if err := ws.ReadJSON(&msg.msg); err != nil {
				log.Println("err reading from websocket connection:", err.Error())

				Allroom.DeleteParticipant(id, ws)

				BroadcastChan <- BroadCastMessage{
					roomID: id,
					msg: map[string]interface{}{
						"type": "left",
						"left": true,
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
