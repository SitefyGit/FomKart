'use client'

import { useEffect, useRef, useState } from 'react'
import { Video, Mic, MicOff, VideoOff, PhoneOff, Copy, Check, Monitor, MonitorOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface WebRTCVideoCallProps {
  orderId: string
  currentUser: any
  onLeave: () => void
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export default function WebRTCVideoCall({ orderId, currentUser, onLeave }: WebRTCVideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [status, setStatus] = useState('Initializing...')
  const [copied, setCopied] = useState(false)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    const init = async () => {
      try {
        setStatus('Accessing camera/mic...')
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setLocalStream(stream)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        setStatus('Connecting to signaling server...')
        const pc = new RTCPeerConnection(ICE_SERVERS)
        peerConnection.current = pc

        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream)
        })

        // Handle remote tracks
        pc.ontrack = (event) => {
          console.log('Received remote track')
          setRemoteStream(event.streams[0])
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0]
          }
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            channelRef.current?.send({
              type: 'broadcast',
              event: 'ice-candidate',
              payload: event.candidate,
            })
          }
        }

        pc.onconnectionstatechange = () => {
          console.log('Connection state:', pc.connectionState)
          if (pc.connectionState === 'connected') {
            setStatus('Connected')
          } else if (pc.connectionState === 'disconnected') {
            setStatus('Disconnected')
          }
        }

        // Signaling via Supabase Realtime
        const channel = supabase.channel(`call-${orderId}`)
        channelRef.current = channel

        channel
          .on('broadcast', { event: 'offer' }, async ({ payload }: any) => {
            if (!pc) return
            console.log('Received offer')
            await pc.setRemoteDescription(new RTCSessionDescription(payload))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            channel.send({
              type: 'broadcast',
              event: 'answer',
              payload: answer,
            })
          })
          .on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
            if (!pc) return
            console.log('Received answer')
            await pc.setRemoteDescription(new RTCSessionDescription(payload))
          })
          .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: any) => {
            if (!pc) return
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload))
            } catch (e) {
              console.error('Error adding received ice candidate', e)
            }
          })
          .subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
              setStatus('Waiting for peer...')
              // Create offer if we are the initiator (simple logic: just try to create offer after a delay or button press, 
              // but for simplicity let's say whoever joins last might trigger, or we need a "start call" button.
              // Better: Just announce we are here.
              
              // For this simple implementation, let's try to create an offer immediately.
              // In a real app, you'd handle "polite peer" logic to avoid glare.
              // We'll assume the caller (seller) initiates usually, but here both might join.
              // Let's add a manual "Start Call" button or auto-start if we are the first?
              // Actually, with Supabase broadcast, we don't know who is there easily without presence.
              // Let's just send an offer. If we get an offer back while making one, we might have a collision.
              // Simple fix: Random delay before offering to reduce collision chance?
              
              // Let's rely on a "Connect" button or just auto-offer.
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              channel.send({
                type: 'broadcast',
                event: 'offer',
                payload: offer,
              })
            }
          })

      } catch (err) {
        console.error('Error initializing call:', err)
        setStatus('Error accessing media devices')
      }
    }

    init()

    return () => {
      localStream?.getTracks().forEach(track => track.stop())
      peerConnection.current?.close()
      channelRef.current?.unsubscribe()
    }
  }, [orderId])

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
      setIsVideoOff(!isVideoOff)
    }
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen share
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      const videoTrack = stream.getVideoTracks()[0]
      
      if (peerConnection.current) {
        const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video')
        if (sender) {
          sender.replaceTrack(videoTrack)
        }
      }
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      setLocalStream(stream)
      setIsScreenSharing(false)
      setIsVideoOff(false)
    } else {
      // Start screen share
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const screenTrack = stream.getVideoTracks()[0]
        
        if (peerConnection.current) {
          const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video')
          if (sender) {
            sender.replaceTrack(screenTrack)
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        
        screenTrack.onended = () => {
          toggleScreenShare() // Revert when user stops sharing via browser UI
        }

        setLocalStream(stream) // Note: this replaces audio tracks too if not careful, but getDisplayMedia usually has no audio or system audio.
        // Ideally we mix the mic audio with display video.
        // For simplicity, we just replace the video track on the peer connection.
        setIsScreenSharing(true)
      } catch (e) {
        console.error('Error sharing screen:', e)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col text-white">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-full">
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
      <div className="flex-1 relative p-4 flex gap-4 items-center justify-center bg-black">
        {/* Remote Video (Large) */}
        <div className="relative flex-1 h-full max-h-full bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
          {remoteStream ? (
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-8">
              <div className="animate-pulse w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Video className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400">Waiting for other participant...</p>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-sm">
            Remote User
          </div>
        </div>

        {/* Local Video (Small overlay or side) */}
        <div className="absolute bottom-8 right-8 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-xl border-2 border-gray-700">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <VideoOff className="w-8 h-8 text-gray-500" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-xs">
            You
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center gap-4 shrink-0">
        <button 
          onClick={toggleMute}
          className={`p-4 rounded-full transition ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <button 
          onClick={toggleVideo}
          className={`p-4 rounded-full transition ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>
        <button 
          onClick={toggleScreenShare}
          className={`p-4 rounded-full transition ${isScreenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
        </button>
      </div>
    </div>
  )
}
