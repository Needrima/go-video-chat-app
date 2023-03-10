package controllers

import (
	"sync"

	"github.com/gorilla/websocket"
)

var (
	rooms = map[string][]*websocket.Conn{}
	mu    *sync.Mutex
)
