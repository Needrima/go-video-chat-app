package routes

import (
	"go-react-video-chat-backend/controllers"

	"github.com/gorilla/mux"
)

func NewRouter() *mux.Router {
	router := mux.NewRouter()

	router.HandleFunc("/create_room", controllers.CreateRoom)
	router.HandleFunc("/join_room/{room_id}", controllers.JoinRoom)

	return router
}
