package main

import (
	"fmt"
	"go-react-video-chat-backend/controllers"
	"go-react-video-chat-backend/routes"
	"log"
	"net/http"
)

func main() {
	controllers.Allroom.Init()

	router := routes.NewRouter()
	fmt.Println("serving on port 8080....")
	log.Fatal(http.ListenAndServe(":8080", router))
}
