import React from 'react'
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import './style.scss'

const Chat = () => {
  const roomID = useParams()['roomID'];
  const navigate = useNavigate();

  const localVid = useRef();
  const remoteVid = useRef();
  const ws = useRef();
  const peerRef = useRef();

  const [deviceState, setDeviceState] = useState({
    mic: true,
    cam: true,
  })

  const {mic, cam} = deviceState;

  const toggleMicrophone = () => {
    setDeviceState(state => ({
      ...state,
      mic: !state.mic,
    }))
  }

  const toggleCamera= () => {
    setDeviceState(state => ({
      ...state,
      cam: !state.cam,
    }))
  }
  
  useEffect(() => {
    setupStream();
  }, [])

  const setupStream = async () => {
    // setup user camera
    const streamObj = await navigator.mediaDevices.getUserMedia({audio: true, video:true});
    localVid.current.srcObject = streamObj;
    localVid.current = streamObj;



    ws.current = new WebSocket(`ws://localhost:8080/join_room/${roomID}`);
    ws.current.addEventListener('error', (error) => {
      console.log('websocket error', error)
      alert('something went wrong redirecting to home page')
      navigate('/')
    })

    ws.current.addEventListener('open', () => {
      ws.current.send(JSON.stringify({
        type: 'join',
        join: true,
      }))
    })

    ws.current.addEventListener('message', async (msg) => {
      let data = JSON.parse(msg.data);
      switch (data['type']) {
        case 'join':
          callNewUser();
          break;
        case 'left': 
          alert('user left chat');
          break;
        case 'ice-candidate':
          console.log('receiving and adding ice candidate');
          try {
            await peerRef.current.addIceCandidate(data['iceCandidate'])
          }catch(err) {
            console.log('could not add iceCandidate', err)
          }
          break;
        case 'offer':
          handleOffer(data['offer'])
          break;
        case 'answer':
          peerRef.current.setRemoteDescription(new RTCSessionDescription(data['answer']))
          break;
      }
    })
  }

  const handleOffer = async (offer) => {
    peerRef.current = createPeer();
    
    await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));

    // add user tracks to RTC peer connection
    localVid.current.getTracks().forEach(track => peerRef.current.addTrack(track, localVid.current))

    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer)

    ws.current.send(JSON.stringify({
      type: 'answer',
      answer: peerRef.current.localDescription,
    }))
  }

  const callNewUser = async () => {
    console.log('about to call new user')
    peerRef.current = createPeer();

    // add user tracks to RTC peer connection
    localVid.current.getTracks().forEach(track => peerRef.current.addTrack(track, localVid.current))
  }

  const createPeer = () => {
    console.log('creating peer')

    const peer = new RTCPeerConnection({
      iceServers: [{urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]}]
    })

    peer.addEventListener('negotiationneeded', handleNegotiations)
    peer.addEventListener('icecandidate', handleIceCandidates)
    peer.addEventListener('track', handleTrack)

    return peer
  }

  const handleNegotiations = async () => {
    console.log('creating offer');
    try {
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);

      ws.current.send(JSON.stringify({
        type: "offer",
        offer: peerRef.current.localDescription,
      }))
    }catch(err) {
      console.log(err)
    }
  }

  const handleIceCandidates = (e) => {
    console.log('ice candidate found');
    if (e.candidate) {
      console.log(e.candidate);

      ws.current.send(JSON.stringify({
        type: "ice-candidate",
        iceCandidate: e.candidate,
      }))
    }
  }

  // fires when there is a new track(audio/video added to to RTC peer connection)
  const handleTrack = (e) => {
    console.log('streams:', e.streams)
    remoteVid.current.srcObject = e.streams[0];
  }
 
  return (
    <div className='container-fluid'>
      <div className="row justify-content-between">
        <div className="col d-flex flex-column justify-content-center align-items-center">
          <video autoPlay muted ref={localVid} style={{width:'100%'}} />

          <div className='device-controls mt-4'>
            {mic && <i className="bi bi-mic-fill display-3 text-light p-3 rounded-circle bg-success mx-4 device" onClick={toggleMicrophone}></i>}
            {!mic && <i className="bi bi-mic-mute-fill display-3 text-light p-3 rounded-circle bg-danger mx-4 device" onClick={toggleMicrophone}></i>}
            {cam && <i className="bi bi-camera-video-fill display-3 text-light p-3 rounded-circle bg-success mx-4 device" onClick={toggleCamera}></i>}
            {!cam && <i className="bi bi-camera-video-off-fill display-3 text-light p-3 rounded-circle bg-danger mx-4 device" onClick={toggleCamera}></i>}
            <i class="bi bi-telephone-fill display-3 text-light p-3 rounded-circle bg-danger mx-4 device"></i>
          </div>
        </div>

        <div className="col d-flex justify-content-center">
          <video autoPlay muted ref={remoteVid} style={{width:'100%'}} />
        </div>
      </div>
    </div>
  )
}

export default Chat