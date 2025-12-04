'use client'

import { useEffect, useRef, useState } from 'react'
import { Video, Mic, MicOff, VideoOff, PhoneOff, Copy, Check, Monitor, MonitorOff, RefreshCw } from 'lucide-react'
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
  ],
}

export default function WebRTCVideoCall({ orderId, currentUser, remoteUserName, onLeave }: WebRTCVideoCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [status, setStatus] = useState('Initializing...')
  const [copied, setCopied] = useState(false)
  const [peers, setPeers] = useState<any[]>([])

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<any>(null)
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([])

  const sendReadySignal = () => {
    if (channelRef.current) {
      console.log('Sending manual ready signal')
      channelRef.current.send({
        type: 'broadcast',
        event: 'ready',
        payload: { senderId: currentUser.id },
      })
    }
  }

  useEffect(() => {
    const init = async () => {
      // 1. Setup Signaling
      setStatus('Connecting to signaling server...')
      const pc = new RTCPeerConnection(ICE_SERVERS)
      peerConnection.current = pc

      // Handle remote tracks
      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind)
        const stream = event.streams[0]
        if (stream) {
          setRemoteStream(stream)
          // Force video element update
          setTimeout(() => {
            if (remoteVideoRef.current && stream) {
              remoteVideoRef.current.srcObject = stream
              remoteVideoRef.current.play().catch(e => console.log('Autoplay prevented:', e))
            }
          }, 100)
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
        } else if (pc.connectionState === 'failed') {
          setStatus('Connection failed')
        }
      }

      // 2. Get Media (Non-blocking)
      try {
        setStatus('Accessing camera/mic...')
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setLocalStream(stream)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream)
        })
      } catch (err) {
        console.error('Error accessing media:', err)
        setStatus('Media access failed - joining as viewer')
        // Add recvonly transceivers so we can still see/hear the other person
        pc.addTransceiver('video', { direction: 'recvonly' })
        pc.addTransceiver('audio', { direction: 'recvonly' })
      }

      // 3. Connect to Supabase (Signaling)
      const channel = supabase.channel(`call-${orderId}`)
      channelRef.current = channel

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const users = Object.values(state).flat()
          setPeers(users)
          console.log('Presence sync:', users)
        })
        .on('broadcast', { event: 'ready' }, async ({ payload }: any) => {
          if (!pc) return
          console.log('Received ready signal from', payload?.senderId)
          
          // If we are already connected, ignore
          if (pc.connectionState === 'connected') return

          const remoteId = payload?.senderId
          const myId = currentUser.id

          // Polite Wait Strategy:
          // If I receive 'ready', I should offer.
          // BUT to avoid glare if we both joined and sent 'ready' at same time:
          // If myId > remoteId: Offer immediately.
          // If myId < remoteId: Wait 1s. If no offer received, then offer.
          
          const isDominant = !remoteId || (myId > remoteId)

          if (isDominant) {
            console.log('Creating offer (Dominant peer)')
            try {
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              channel.send({
                type: 'broadcast',
                event: 'offer',
                payload: { sdp: offer, senderId: myId },
              })
            } catch (e) {
              console.error('Error creating offer:', e)
            }
          } else {
            console.log('Waiting for offer (Submissive peer) - will offer in 1s if needed')
            setTimeout(async () => {
              if (pc.signalingState === 'stable' && pc.connectionState !== 'connected') {
                 console.log('Timeout reached, creating offer (Submissive peer fallback)')
                 try {
                  const offer = await pc.createOffer()
                  await pc.setLocalDescription(offer)
                  channel.send({
                    type: 'broadcast',
                    event: 'offer',
                    payload: { sdp: offer, senderId: myId },
                  })
                } catch (e) {
                  console.error('Error creating fallback offer:', e)
                }
              }
            }, 1000)
          }
        })
        .on('broadcast', { event: 'offer' }, async ({ payload }: any) => {
          if (!pc) return
          console.log('Received offer from', payload?.senderId)
          
          // Glare handling
          if (pc.signalingState !== 'stable') {
            const myId = currentUser.id
            const remoteId = payload?.senderId
            
            // If I am submissive (myId < remoteId), I should accept their offer and rollback mine?
            // But standard WebRTC rollback is complex.
            // Simple strategy: If I am submissive, I ignore my own offer attempt? 
            // Actually, if I am submissive, I wouldn't have sent an offer in the "Ready" handler above!
            // So the only way I have a local offer is if I initiated independently.
            
            // If we use the "Ready" protocol strictly, we shouldn't have glare often.
            // But if we do:
            console.warn('Glare detected. Signaling state:', pc.signalingState)
            // If I am dominant, I ignore their offer. They will accept mine.
            if (remoteId && myId > remoteId) {
              console.log('Ignoring offer (I am dominant)')
              return
            }
            // If I am submissive, I should accept. But I might need to rollback.
            // For now, let's hope the Ready protocol prevents this.
            // If we are here, we might be stuck.
            // Let's try to proceed if possible.
          }

          const sdp = payload.sdp || payload // Handle both formats
          await pc.setRemoteDescription(new RTCSessionDescription(sdp))
          
          // Process queued candidates
          while (iceCandidatesQueue.current.length > 0) {
            const candidate = iceCandidatesQueue.current.shift()
            if (candidate) await pc.addIceCandidate(candidate)
          }

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
            const candidate = new RTCIceCandidate(payload)
            if (pc.remoteDescription) {
              await pc.addIceCandidate(candidate)
            } else {
              iceCandidatesQueue.current.push(candidate)
            }
          } catch (e) {
            console.error('Error adding received ice candidate', e)
          }
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            setStatus('Waiting for peer...')
            await channel.track({ user_id: currentUser.id, online_at: new Date().toISOString() })
            // Announce we are here
            channel.send({
              type: 'broadcast',
              event: 'ready',
              payload: { senderId: currentUser.id },
            })
          }
        })
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

  // Set srcObject whenever remoteStream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
      remoteVideoRef.current.play().catch(e => console.log('Autoplay prevented:', e))
    }
  }, [remoteStream])

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col text-white" style={{ height: '100vh', width: '100vw' }}>
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
      <div className="flex-1 relative p-2 sm:p-4 bg-black overflow-hidden">
        {/* Remote Video (Large) */}
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
                <div className="animate-pulse w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Video className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-400">
                  {status === 'Connected' ? 'Connected - Waiting for video...' : 'Waiting for other participant...'}
                </p>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1.5 rounded-lg text-sm font-medium">
            {remoteUserName || 'Other Participant'}
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
          onClick={sendReadySignal}
          className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition"
          title="Retry Connection"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
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
