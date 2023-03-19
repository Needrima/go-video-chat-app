package controllers

import (
	"errors"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

type Participant struct {
	Host bool
	Conn *websocket.Conn
}

type Rooms struct {
	mu    *sync.Mutex
	rooms map[string]map[Participant]bool
}

var Allroom Rooms

func (r *Rooms) Init() {
	r.rooms = make(map[string]map[Participant]bool)
}

// deleteFromRoom deletes connection ws from room with id roomId
func (r *Rooms) DeleteRoom(id string) {
	delete(r.rooms, id)
}

func (r *Rooms) DeleteParticipant(id string, ws *websocket.Conn) {
	room := r.rooms[id]

	for participant, _ := range room {
		if participant.Conn == ws {
			log.Println("deleting participant with from chat with id:", id)
			delete(room, participant)
			return
		}
	}
}

func (r *Rooms) CreateRoom() string {

	id := generateID()
	r.rooms[id] = map[Participant]bool{}

	return id
}

func (r *Rooms) AddToRoom(id string, ws *websocket.Conn) error {

	if len(r.rooms[id]) == 2 {
		log.Println("room already holds maximum participants")
		return errors.New("room already holds maximum participants")
	}

	p := Participant{Conn: ws}

	_, ok := r.rooms[id]

	if !ok {
		p.Host = true
	}

	log.Println("adding connection to room with ID:", id)
	r.rooms[id][p] = true

	return nil
}

type BroadCastMessage struct {
	msg    map[string]interface{}
	roomID string
	conn   *websocket.Conn
}

var BroadcastChan = make(chan BroadCastMessage)

// BroadCastMessageToRoom listens for any message in BraodcastChan and broadcasts the message to every connection in the appropriate room 
// except the connection sending the message
// . See type BroadCastMessage to know the message formats been sent to BroadcastChan
func BroadCastMessageToRoom() {
	for {
		msg := <-BroadcastChan
		room := Allroom.rooms[msg.roomID]
		for participant, _ := range room {
			if participant.Conn != msg.conn {
				if err := participant.Conn.WriteJSON(msg.msg); err != nil {
					log.Println("writing message to connection error:", err)
					participant.Conn.Close()
				}
			}
		}
	}
}
