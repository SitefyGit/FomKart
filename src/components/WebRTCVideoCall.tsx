'use client'

import { useEffect, useRef, useState } from 'react'
import { Video, Mic, MicOff, VideoOff, PhoneOff, Monitor, MonitorOff, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface WebRTCVideoCallProps {
  orderId: string
  currentUser: any
  remoteUserName?: string
  onLeave: () => void
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

// Broadcast call status to presence channel (for "Join Active Call" button)
const broadcastCallStatus = (orderId: string, active: boolean) => {
  const presenceChannel = supabase.channel(`video-call-presence-${orderId}`)
  presenceChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      presenceChannel.send({
        type: 'broadcast',
        event: 'call-status',
        payload: { active }
      })
      // Unsubscribe after sending
      setTimeout(() => supabase.removeChannel(presenceChannel), 1000)
    }
  })
}

export default function WebRTCVideoCall({ orderId, currentUser, remoteUserName, onLeave }: WebRTCVideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [status, setStatus] = useState('Initializing...')
  const [logs, setLogs] = useState<string[]>([])
  const [participantLeft, setParticipantLeft] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const hasCreatedOffer = useRef(false)

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    console.log(`[WebRTC ${time}] ${msg}`)
    setLogs(prev => [...prev.slice(-20), `${time}: ${msg}`])
  }

  // Broadcast call active status when component mounts/unmounts
  useEffect(() => {
    broadcastCallStatus(orderId, true)
    return () => {
      broadcastCallStatus(orderId, false)
    }
  }, [orderId])

  useEffect(() => {
    let mounted = true
    let pc: RTCPeerConnection | null = null
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupCall = async () => {
      addLog('Starting setup...')
      
      // Step 1: Get user media
      let stream: MediaStream | null = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        })
        addLog(`Got media: ${stream.getTracks().map(t => t.kind).join(', ')}`)
        localStreamRef.current = stream
        setLocalStream(stream)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      } catch (err: any) {
        addLog(`Media error: ${err.message}`)
        setStatus('No camera access')
      }

      // Step 2: Create peer connection
      pc = new RTCPeerConnection(ICE_SERVERS)
      pcRef.current = pc
      addLog('Created RTCPeerConnection')

      // Add tracks
      if (stream) {
        stream.getTracks().forEach(track => {
          pc!.addTrack(track, stream!)
          addLog(`Added track: ${track.kind}`)
        })
      } else {
        // Receive only mode
        pc.addTransceiver('video', { direction: 'recvonly' })
        pc.addTransceiver('audio', { direction: 'recvonly' })
        addLog('Added recvonly transceivers')
      }

      // Handle remote stream
      pc.ontrack = (e) => {
        addLog(`Got remote track: ${e.track.kind}`)
        if (e.streams[0]) {
          setRemoteStream(e.streams[0])
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = e.streams[0]
          }
        }
      }

      // Handle ICE candidates
      pc.onicecandidate = (e) => {
        if (e.candidate && channel) {
          addLog('Sending ICE candidate')
          channel.send({
            type: 'broadcast',
            event: 'webrtc',
            payload: { 
              type: 'ice', 
              candidate: e.candidate,
              from: currentUser.id 
            }
          })
        }
      }

      pc.oniceconnectionstatechange = () => {
        addLog(`ICE state: ${pc?.iceConnectionState}`)
        // Detect when peer disconnects
        if (pc?.iceConnectionState === 'disconnected' || pc?.iceConnectionState === 'failed') {
          if (mounted) {
            setParticipantLeft(true)
            setStatus('Participant disconnected')
            setRemoteStream(null)
          }
        }
      }

      pc.onconnectionstatechange = () => {
        const state = pc?.connectionState
        addLog(`Connection state: ${state}`)
        if (mounted) {
          if (state === 'connected') {
            setStatus('Connected!')
            setParticipantLeft(false)
          }
          else if (state === 'connecting') setStatus('Connecting...')
          else if (state === 'failed') {
            setStatus('Connection failed')
            setParticipantLeft(true)
          }
          else if (state === 'disconnected') {
            setStatus('Participant disconnected')
            setParticipantLeft(true)
            setRemoteStream(null)
          }
        }
      }

      // Step 3: Setup Supabase channel
      const channelName = `video-call-${orderId}`
      addLog(`Joining channel: ${channelName}`)
      
      channel = supabase.channel(channelName)
      channelRef.current = channel

      // Handle participant leaving
      channel.on('broadcast', { event: 'leave' }, ({ payload }) => {
        if (payload.from !== currentUser.id && mounted) {
          addLog('Participant left the call')
          setParticipantLeft(true)
          setStatus('Participant left')
          setRemoteStream(null)
        }
      })

      // Handle WebRTC signaling
      channel.on('broadcast', { event: 'webrtc' }, async ({ payload }) => {
        if (!pc || !mounted) return
        if (payload.from === currentUser.id) return // Ignore own messages
        
        addLog(`Received: ${payload.type} from ${payload.from?.slice(0,8)}`)

        try {
          if (payload.type === 'offer') {
            addLog('Processing offer...')
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
            
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            
            addLog('Sending answer...')
            channel!.send({
              type: 'broadcast',
              event: 'webrtc',
              payload: { 
                type: 'answer', 
                sdp: answer,
                from: currentUser.id 
              }
            })
            
          } else if (payload.type === 'answer') {
            addLog('Processing answer...')
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
            
          } else if (payload.type === 'ice' && payload.candidate) {
            addLog('Adding ICE candidate...')
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate))
            
          } else if (payload.type === 'ready') {
            // Other user is ready - if we haven't offered, create offer
            if (!hasCreatedOffer.current && pc.signalingState === 'stable') {
              addLog('Other user ready, creating offer...')
              hasCreatedOffer.current = true
              
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              
              channel!.send({
                type: 'broadcast',
                event: 'webrtc',
                payload: { 
                  type: 'offer', 
                  sdp: offer,
                  from: currentUser.id 
                }
              })
              addLog('Offer sent!')
            }
          }
        } catch (err: any) {
          addLog(`Error: ${err.message}`)
        }
      })

      // Subscribe to channel
      channel.subscribe(async (status) => {
        addLog(`Channel status: ${status}`)
        
        if (status === 'SUBSCRIBED' && mounted) {
          setStatus('Connected to room, waiting...')
          
          // Broadcast that we're ready
          setTimeout(() => {
            addLog('Broadcasting ready signal...')
            channel!.send({
              type: 'broadcast',
              event: 'webrtc',
              payload: { 
                type: 'ready',
                from: currentUser.id 
              }
            })
          }, 500)
          
          // After 2 seconds, if no offer received, create one
          setTimeout(() => {
            if (!hasCreatedOffer.current && pc && pc.signalingState === 'stable' && pc.connectionState === 'new') {
              addLog('Timeout - creating offer proactively...')
              hasCreatedOffer.current = true
              
              pc.createOffer().then(offer => {
                return pc!.setLocalDescription(offer).then(() => {
                  channel!.send({
                    type: 'broadcast',
                    event: 'webrtc',
                    payload: { 
                      type: 'offer', 
                      sdp: offer,
                      from: currentUser.id 
                    }
                  })
                  addLog('Proactive offer sent!')
                })
              }).catch(err => addLog(`Offer error: ${err.message}`))
            }
          }, 2500)
        }
      })
    }

    setupCall()

    return () => {
      mounted = false
      addLog('Cleaning up...')
      // Broadcast that we're leaving
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'leave',
          payload: { from: currentUser.id }
        })
      }
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      pcRef.current?.close()
      if (channelRef.current) {
        setTimeout(() => {
          if (channelRef.current) supabase.removeChannel(channelRef.current)
        }, 500)
      }
    }
  }, [orderId, currentUser.id])

  // Sync remote video
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = isMuted)
    setIsMuted(!isMuted)
  }

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = isVideoOff)
    setIsVideoOff(!isVideoOff)
  }

  const retry = async () => {
    addLog('Retrying...')
    const pc = pcRef.current
    const channel = channelRef.current
    if (!pc || !channel) return

    hasCreatedOffer.current = true
    setStatus('Retrying...')
    
    try {
      const offer = await pc.createOffer({ iceRestart: true })
      await pc.setLocalDescription(offer)
      
      channel.send({
        type: 'broadcast',
        event: 'webrtc',
        payload: { 
          type: 'offer', 
          sdp: offer,
          from: currentUser.id 
        }
      })
      addLog('Retry offer sent')
    } catch (err: any) {
      addLog(`Retry error: ${err.message}`)
    }
  }

  const toggleScreenShare = async () => {
    const pc = pcRef.current
    if (!pc) return

    if (isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        const track = stream.getVideoTracks()[0]
        const sender = pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender) await sender.replaceTrack(track)
        localStreamRef.current?.getVideoTracks().forEach(t => t.stop())
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
        setIsScreenSharing(false)
      } catch (e) {}
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const track = stream.getVideoTracks()[0]
        const sender = pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender) await sender.replaceTrack(track)
        track.onended = () => toggleScreenShare()
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
        setIsScreenSharing(true)
      } catch (e) {}
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${status === 'Connected!' ? 'bg-green-600' : 'bg-blue-600'}`}>
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-white">Live Consultation</h3>
            <p className="text-xs text-gray-400">{status}</p>
          </div>
        </div>
        <button 
          onClick={onLeave}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <PhoneOff className="w-4 h-4" />
          End
        </button>
      </div>

      {/* Videos */}
      <div className="flex-1 relative bg-black p-2 overflow-hidden">
        {/* Remote video */}
        <div className="w-full h-full bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline
            className={`w-full h-full object-contain ${!remoteStream ? 'hidden' : ''}`}
          />
          {!remoteStream && (
            <div className="text-center text-white">
              {participantLeft ? (
                <>
                  <div className="w-20 h-20 bg-red-900/50 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <PhoneOff className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-red-400 font-medium">Participant Left</p>
                  <p className="text-gray-500 text-sm mt-1">{remoteUserName} has ended the call</p>
                  <button 
                    onClick={onLeave}
                    className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Leave Call
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                    <Video className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400">{status}</p>
                  <p className="text-gray-500 text-sm mt-1">{remoteUserName || 'Waiting for participant...'}</p>
                </>
              )}
            </div>
          )}
          {remoteStream && (
            <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded text-white text-sm">
              {remoteUserName || 'Participant'}
            </div>
          )}
        </div>

        {/* Local video */}
        <div className="absolute bottom-4 right-4 w-32 h-24 sm:w-40 sm:h-32 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${isVideoOff || !localStream ? 'hidden' : ''}`}
          />
          {(isVideoOff || !localStream) && (
            <div className="w-full h-full flex items-center justify-center">
              <VideoOff className="w-6 h-6 text-gray-500" />
            </div>
          )}
          <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-white text-xs">
            You
          </div>
        </div>

        {/* Debug logs - collapsible */}
        <details className="absolute top-2 left-2 bg-black/80 text-xs text-green-400 rounded max-w-xs max-h-40 overflow-auto">
          <summary className="cursor-pointer px-2 py-1 text-gray-400">Logs ({logs.length})</summary>
          <div className="px-2 pb-2">
            {logs.map((log, i) => <div key={i}>{log}</div>)}
          </div>
        </details>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center gap-4 shrink-0">
        <button onClick={retry} className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white">
          <RefreshCw className="w-6 h-6" />
        </button>
        <button 
          onClick={toggleMute}
          disabled={!localStream}
          className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} ${!localStream ? 'opacity-50' : 'hover:bg-gray-600'} text-white`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <button 
          onClick={toggleVideo}
          disabled={!localStream}
          className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} ${!localStream ? 'opacity-50' : 'hover:bg-gray-600'} text-white`}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>
        <button 
          onClick={toggleScreenShare}
          disabled={!localStream}
          className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-500' : 'bg-gray-700'} ${!localStream ? 'opacity-50' : 'hover:bg-gray-600'} text-white`}
        >
          {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
        </button>
      </div>
    </div>
  )
}
