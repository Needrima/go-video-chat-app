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

  const [state, setState] = useState({
    mic: true,
    cam: true,
  })

  const {mic, cam} = state;

  const toggleMicrophone = () => {
    const audio = localVid.current.getTracks().find(track => track.kind === 'audio')
    if (audio.enabled) {
      audio.enabled = false;
      setState(state => ({
        ...state,
        mic: false,
      }))
    }else {
      audio.enabled = true;
      setState(state => ({
        ...state,
        mic: true,
      }))
    }
  }

  const toggleCamera = () => {
    const video = localVid.current.getTracks().find(track => track.kind === 'video')
    if (video.enabled) {
      video.enabled = false;
      setState(state => ({
        ...state,
        cam: false,
      }))
    }else {
      video.enabled = true;
      setState(state => ({
        ...state,
        cam: true,
      }))
    }
  }

  const showRemoteStream = () => {
    document.getElementById('remote-video').classList.remove('hidden');
    document.getElementById('remote-video').classList.add('big-frame');
    document.getElementById('user-video').classList.remove('big-frame');
    document.getElementById('user-video').classList.add('small-frame');
  }

  const hideRemoteStream = () => {
    document.getElementById('remote-video').classList.remove('big-frame');
    document.getElementById('remote-video').classList.add('hidden');
    document.getElementById('user-video').classList.remove('small-frame');
    document.getElementById('user-video').classList.add('big-frame');
  }
  
  useEffect(() => {
    setupStream();
  }, [])

  const setupStream = async () => {
    // setup user camera
    const streamObj = await navigator.mediaDevices.getUserMedia({audio: true, video: {
        width: {
          min: 640,
          ideal: 1920,
          max: 1920,
        },
        height: {
          min: 480,
          ideal: 1080,
          max:1080,
        }
      }
    });
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
        case 'join': // coming from backend
          callNewUser();
          break;

        case 'left': // coming from backend
          alert("peer left chat")
          hideRemoteStream();
          break;

        case 'unauthorized': // coming from backend
          alert(data["message"])
          navigate("/")
          break;

        case 'ice-candidate': // broadcasted from frontend
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
          peerRef.current.setRemoteDescription(new RTCSessionDescription(data['answer']));
          break;
        default:
          
      }
    })
  }

  const callNewUser = async () => {
    console.log('about to call new user')
    peerRef.current = createPeer();

    // add user tracks to RTC peer connection
    localVid.current.getTracks().forEach(track => peerRef.current.addTrack(track, localVid.current))
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
    // console.log('ice candidate found');
    if (e.candidate) {
      // console.log(e.candidate);

      ws.current.send(JSON.stringify({
        type: "ice-candidate",
        iceCandidate: e.candidate,
      }))
    }
  }

  // fires when there is a new track(audio/video added to to RTC peer connection)
  const handleTrack = (e) => {
    console.log('track:', e.track)
    console.log('video stream:', e.streams[0])

    remoteVid.current.srcObject = e.streams[0];
    showRemoteStream();
  }
 
  return (
    <div className='parent'>

        <video id="user-video" className='big-frame' autoPlay ref={localVid}></video>

        <video id='remote-video' className='hidden' autoPlay ref={remoteVid} />

        <div className='device-controls mt-4'>
            {mic && <i className="bi bi-mic-fill display-4 text-light p-3 rounded-circle bg-success mx-4 device" onClick={toggleMicrophone}></i>}
            {!mic && <i className="bi bi-mic-mute-fill display-4 text-light p-3 rounded-circle bg-danger mx-4 device" onClick={toggleMicrophone}></i>}
            {cam && <i className="bi bi-camera-video-fill display-4 text-light p-3 rounded-circle bg-success mx-4 device" onClick={toggleCamera}></i>}
            {!cam && <i className="bi bi-camera-video-off-fill display-4 text-light p-3 rounded-circle bg-danger mx-4 device" onClick={toggleCamera}></i>}
            <a href="/"><i className="bi bi-telephone-fill display-4 text-light p-3 rounded-circle bg-danger mx-4 device"></i></a>
        </div>
    </div>
  )
}

export default Chat