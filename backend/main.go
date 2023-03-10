package main

import (
	"fmt"
	"go-react-video-chat-backend/routes"
	"log"
	"net/http"
)

func main() {
	router := routes.NewRouter()

	fmt.Println("serving on port 8080....")
	log.Fatal(http.ListenAndServe(":8080", router))
}
