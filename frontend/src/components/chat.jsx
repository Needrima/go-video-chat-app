import React from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import {useParams} from 'react-router-dom'

const Chat = () => {
  const roomID = useParams()['roomID'];
  const localVid = useRef();
  const remoteVid = useRef();
  
  useEffect(() => {
    const setUpstream = async () => {
      const streamObj = await navigator.mediaDevices.getUserMedia({audio: true, video:true});
      localVid.current.srcObject = streamObj;
    }

    setUpstream();

    const ws = new WebSocket(`ws://localhost:8080/join_room/${roomID}`);
    ws.addEventListener('open', () => {
      console.log("connection open")
      ws.send(JSON.stringify({
        "join": true,
      }))
    })
  }, [])

  return (
    <div className='container-fluid'>
      <div className="row justify-content-between">
        <div className="col-5 d-flex justify-content-center">
          <video autoPlay muted ref={localVid} style={{width:'300px', height: '300px', border:'2px solid green'}} />
        </div>

        <div className="col-5 d-flex justify-content-center">
          <video autoPlay muted ref={remoteVid} style={{width:'300px', height: '300px', border:'2px solid green'}} />
        </div>
      </div>
    </div>
  )
}

export default Chat