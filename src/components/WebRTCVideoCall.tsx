'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Video, Mic, MicOff, VideoOff, PhoneOff, Monitor, MonitorOff, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface WebRTCVideoCallProps {
  orderId: string
  currentUser: any
  remoteUserName?: string
  onLeave: () => void
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
}

export default function WebRTCVideoCall({ orderId, currentUser, remoteUserName, onLeave }: WebRTCVideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [status, setStatus] = useState('Initializing...')
  const [connectionState, setConnectionState] = useState<string>('new')

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<any>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const makingOffer = useRef(false)
  const ignoreOffer = useRef(false)
  const isPolite = useRef(false)
  const remoteUserId = useRef<string | null>(null)

  const log = useCallback((msg: string) => {
    console.log(`[WebRTC ${new Date().toLocaleTimeString()}] ${msg}`)
  }, [])

  // Perfect Negotiation Pattern implementation
  useEffect(() => {
    let pc: RTCPeerConnection | null = null
    let channel: any = null
    let mounted = true

    const init = async () => {
      log('Starting initialization...')
      setStatus('Connecting...')

      // 1. Get local media FIRST
      let stream: MediaStream | null = null
      try {
        log('Requesting camera/mic access...')
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: { echoCancellation: true, noiseSuppression: true }
        })
        log(`Got local stream with ${stream.getTracks().length} tracks`)
        localStreamRef.current = stream
        setLocalStream(stream)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      } catch (err: any) {
        log(`Media access failed: ${err.message}`)
        setStatus('No camera - viewer mode')
      }

      // 2. Create peer connection
      log('Creating RTCPeerConnection...')
      pc = new RTCPeerConnection(ICE_SERVERS)
      peerConnection.current = pc

      // 3. Add tracks BEFORE any negotiation
      if (stream) {
        stream.getTracks().forEach(track => {
          log(`Adding local track: ${track.kind}`)
          pc!.addTrack(track, stream!)
        })
      } else {
        log('Adding recvonly transceivers (no local media)')
        pc.addTransceiver('video', { direction: 'recvonly' })
        pc.addTransceiver('audio', { direction: 'recvonly' })
      }

      // 4. Handle incoming tracks
      pc.ontrack = (event) => {
        log(`*** Received remote track: ${event.track.kind} ***`)
        const [incomingStream] = event.streams
        if (incomingStream && mounted) {
          log(`Setting remote stream with ${incomingStream.getTracks().length} tracks`)
          setRemoteStream(incomingStream)
          
          // Ensure video element gets the stream
          setTimeout(() => {
            if (remoteVideoRef.current && mounted) {
              remoteVideoRef.current.srcObject = incomingStream
              remoteVideoRef.current.play().catch(e => log(`Play error: ${e.message}`))
            }
          }, 100)
        }
      }

      // 5. Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && channel) {
          log(`Sending ICE candidate to ${remoteUserId.current || 'unknown'}`)
          channel.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: { 
              candidate: event.candidate, 
              senderId: currentUser.id,
              targetId: remoteUserId.current 
            },
          })
        }
      }

      pc.oniceconnectionstatechange = () => {
        log(`ICE connection state: ${pc?.iceConnectionState}`)
        if (pc?.iceConnectionState === 'failed') {
          log('ICE failed - attempting restart')
          pc.restartIce()
        }
      }

      pc.onconnectionstatechange = () => {
        const state = pc?.connectionState || 'unknown'
        log(`Connection state: ${state}`)
        setConnectionState(state)
        if (mounted) {
          if (state === 'connected') {
            setStatus('Connected')
          } else if (state === 'connecting') {
            setStatus('Connecting...')
          } else if (state === 'disconnected') {
            setStatus('Reconnecting...')
          } else if (state === 'failed') {
            setStatus('Failed - tap retry')
          }
        }
      }

      pc.onsignalingstatechange = () => {
        log(`Signaling state: ${pc?.signalingState}`)
      }

      // 6. Handle negotiation needed
      pc.onnegotiationneeded = async () => {
        if (!mounted || !channel) return
        log('Negotiation needed triggered')
        
        try {
          makingOffer.current = true
          const offer = await pc!.createOffer()
          
          if (pc!.signalingState !== 'stable') {
            log('Signaling state changed during offer creation, aborting')
            return
          }
          
          await pc!.setLocalDescription(offer)
          log(`Sending offer (I am ${isPolite.current ? 'polite' : 'impolite'})`)
          
          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { 
              type: 'offer',
              sdp: pc!.localDescription, 
              senderId: currentUser.id 
            },
          })
        } catch (err: any) {
          log(`Negotiation error: ${err.message}`)
        } finally {
          makingOffer.current = false
        }
      }

      // 7. Connect to signaling channel
      log('Connecting to signaling channel...')
      channel = supabase.channel(`call-${orderId}`, {
        config: { 
          presence: { key: currentUser.id },
          broadcast: { self: false }
        }
      })
      channelRef.current = channel

      // Function to initiate call when we detect another user
      const initiateCallIfNeeded = async (otherUserId: string) => {
        if (!pc || pc.connectionState === 'connected' || pc.connectionState === 'connecting') {
          log('Already connected or connecting, skipping initiation')
          return
        }
        
        remoteUserId.current = otherUserId
        // Higher ID is "impolite" and creates the offer
        isPolite.current = currentUser.id < otherUserId
        log(`Detected user ${otherUserId}. I am ${isPolite.current ? 'polite' : 'impolite'}`)
        
        // The person who was here FIRST (regardless of ID) should initiate
        // OR the impolite peer (higher ID) initiates
        // To simplify: whoever detects the other user and has stable state, creates offer
        
        if (pc.signalingState === 'stable' && pc.connectionState === 'new') {
          log('Creating offer to initiate connection...')
          
          await new Promise(r => setTimeout(r, 300)) // Small delay for stability
          
          try {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: { 
                type: 'offer',
                sdp: pc.localDescription, 
                senderId: currentUser.id 
              },
            })
            log('Offer sent to ' + otherUserId)
          } catch (err: any) {
            log(`Error creating offer: ${err.message}`)
          }
        }
      }

      // Handle presence sync - fires when presence state changes
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const userIds = Object.keys(state)
        log(`Presence sync: ${userIds.length} users: ${userIds.join(', ')}`)
        
        const otherUsers = userIds.filter(id => id !== currentUser.id)
        if (otherUsers.length > 0 && !remoteUserId.current) {
          // First time seeing another user via sync
          initiateCallIfNeeded(otherUsers[0])
        }
      })

      // Handle presence join - fires when a specific user joins
      channel.on('presence', { event: 'join' }, async ({ key }: any) => {
        if (key === currentUser.id) {
          log('I joined the channel')
          return
        }
        
        log(`*** User joined: ${key} ***`)
        initiateCallIfNeeded(key)
      })

      // Handle presence leave - when someone leaves
      channel.on('presence', { event: 'leave' }, ({ key }: any) => {
        if (key !== currentUser.id) {
          log(`User left: ${key}`)
          setStatus('Participant left')
          setRemoteStream(null)
          remoteUserId.current = null
        }
      })

      // Handle signaling messages
      channel.on('broadcast', { event: 'signal' }, async ({ payload }: any) => {
        if (!pc || !mounted) return
        if (payload.senderId === currentUser.id) {
          log('Ignoring own signal message')
          return
        }
        
        const { type, sdp, senderId } = payload
        log(`Received ${type} from ${senderId}`)
        remoteUserId.current = senderId

        try {
          if (type === 'offer') {
            // Handle offer collision (Perfect Negotiation)
            const offerCollision = makingOffer.current || pc.signalingState !== 'stable'
            
            if (offerCollision) {
              log(`Offer collision detected! makingOffer=${makingOffer.current}, state=${pc.signalingState}`)
            }
            
            ignoreOffer.current = !isPolite.current && offerCollision
            
            if (ignoreOffer.current) {
              log('Ignoring incoming offer (I am impolite and have priority)')
              return
            }

            log('Setting remote description (offer)...')
            await pc.setRemoteDescription(new RTCSessionDescription(sdp))
            
            log('Creating answer...')
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            
            log('Sending answer...')
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: { 
                type: 'answer',
                sdp: pc.localDescription, 
                senderId: currentUser.id 
              },
            })
            log('Answer sent!')
            
          } else if (type === 'answer') {
            log('Setting remote description (answer)...')
            await pc.setRemoteDescription(new RTCSessionDescription(sdp))
            log('Answer processed successfully!')
          }
        } catch (err: any) {
          log(`Error handling signal: ${err.message}`)
        }
      })

      // Handle ICE candidates
      channel.on('broadcast', { event: 'ice-candidate' }, async ({ payload }: any) => {
        if (!pc || !mounted) return
        if (payload.senderId === currentUser.id) return
        
        try {
          if (payload.candidate) {
            log('Adding ICE candidate...')
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
          }
        } catch (err: any) {
          if (!ignoreOffer.current) {
            log(`ICE candidate error: ${err.message}`)
          }
        }
      })

      // Subscribe and track presence
      channel.subscribe(async (subStatus: string) => {
        log(`Channel subscription status: ${subStatus}`)
        if (subStatus === 'SUBSCRIBED' && mounted) {
          setStatus('Waiting for participant...')
          await channel.track({ 
            online_at: new Date().toISOString(),
            user_id: currentUser.id
          })
          log('Presence tracked!')
        }
      })
    }

    init()

    return () => {
      mounted = false
      log('Cleaning up...')
      localStreamRef.current?.getTracks().forEach(track => {
        track.stop()
        log(`Stopped track: ${track.kind}`)
      })
      peerConnection.current?.close()
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [orderId, currentUser.id, log])

  // Sync remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      log('Syncing remote stream to video element')
      remoteVideoRef.current.srcObject = remoteStream
      remoteVideoRef.current.play().catch(() => {})
    }
  }, [remoteStream, log])

  const toggleMute = () => {
    if (localStreamRef.current) {
      const enabled = !isMuted
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !enabled
      })
      setIsMuted(enabled)
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const enabled = !isVideoOff
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !enabled
      })
      setIsVideoOff(enabled)
    }
  }

  const toggleScreenShare = async () => {
    const pc = peerConnection.current
    if (!pc) return

    if (isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        const videoTrack = stream.getVideoTracks()[0]
        const sender = pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack)
        }
        localStreamRef.current?.getVideoTracks().forEach(t => t.stop())
        localStreamRef.current = stream
        setLocalStream(stream)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        setIsScreenSharing(false)
      } catch (e) {
        log('Error restoring camera')
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const screenTrack = stream.getVideoTracks()[0]
        const sender = pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender && screenTrack) {
          await sender.replaceTrack(screenTrack)
        }
        screenTrack.onended = () => toggleScreenShare()
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        setIsScreenSharing(true)
      } catch (e) {
        log('Error sharing screen')
      }
    }
  }

  const retryConnection = async () => {
    log('Manual retry requested')
    const pc = peerConnection.current
    const channel = channelRef.current
    if (!pc || !channel) return

    setStatus('Retrying...')
    
    try {
      // ICE restart
      const offer = await pc.createOffer({ iceRestart: true })
      await pc.setLocalDescription(offer)
      
      channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: { 
          type: 'offer',
          sdp: pc.localDescription, 
          senderId: currentUser.id 
        },
      })
      log('ICE restart offer sent')
    } catch (e: any) {
      log(`Retry error: ${e.message}`)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col text-white" style={{ height: '100dvh', width: '100vw' }}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full transition-colors ${
            connectionState === 'connected' ? 'bg-green-600' : 
            connectionState === 'connecting' ? 'bg-yellow-600 animate-pulse' : 
            'bg-blue-600'
          }`}>
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium">Live Consultation</h3>
            <p className="text-xs text-gray-400">{status}</p>
          </div>
        </div>
        <button 
          onClick={onLeave}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          <PhoneOff className="w-4 h-4" />
          End Call
        </button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative p-2 sm:p-4 bg-black overflow-hidden">
        {/* Remote Video */}
        <div className="relative w-full h-full bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline
            className={`w-full h-full object-contain ${!remoteStream ? 'hidden' : ''}`}
          />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <div className={`w-24 h-24 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  connectionState === 'connecting' ? 'animate-pulse' : ''
                }`}>
                  <Video className="w-10 h-10 text-gray-500" />
                </div>
                <p className="text-gray-400 text-lg mb-2">
                  {connectionState === 'connected' ? 'Waiting for video...' : 
                   connectionState === 'connecting' ? 'Connecting...' :
                   'Waiting for participant...'}
                </p>
                <p className="text-gray-500 text-sm">{remoteUserName || 'Other participant'}</p>
              </div>
            </div>
          )}
          {remoteStream && (
            <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {remoteUserName || 'Participant'}
            </div>
          )}
        </div>

        {/* Local Video */}
        <div className="absolute bottom-6 right-6 w-32 h-24 sm:w-48 sm:h-36 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-600">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${isVideoOff || !localStream ? 'hidden' : ''}`}
          />
          {(isVideoOff || !localStream) && (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <VideoOff className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
            </div>
          )}
          <div className="absolute bottom-1 left-1 bg-black/60 px-2 py-0.5 rounded text-xs">
            You {isMuted && '🔇'}
          </div>
        </div>

        {/* Connection state indicator */}
        <div className="absolute top-2 left-2 text-xs bg-black/60 px-2 py-1 rounded flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            connectionState === 'connected' ? 'bg-green-500' :
            connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
            connectionState === 'failed' ? 'bg-red-500' :
            'bg-gray-500'
          }`}></span>
          <span className="text-gray-400 capitalize">{connectionState}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center gap-3 sm:gap-4 shrink-0">
        <button 
          onClick={retryConnection}
          className="p-3 sm:p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition"
          title="Retry Connection"
        >
          <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button 
          onClick={toggleMute}
          disabled={!localStream}
          className={`p-3 sm:p-4 rounded-full transition ${
            isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
          } ${!localStream ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
        <button 
          onClick={toggleVideo}
          disabled={!localStream}
          className={`p-3 sm:p-4 rounded-full transition ${
            isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
          } ${!localStream ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
        <button 
          onClick={toggleScreenShare}
          disabled={!localStream}
          className={`p-3 sm:p-4 rounded-full transition ${
            isScreenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
          } ${!localStream ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isScreenSharing ? <MonitorOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
      </div>
    </div>
  )
}
