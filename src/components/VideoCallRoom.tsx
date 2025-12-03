'use client'

import { useEffect, useRef, useState } from 'react'
import { Video, Mic, MicOff, VideoOff, PhoneOff, Copy, Check } from 'lucide-react'

interface VideoCallRoomProps {
  roomName: string
  displayName: string
  onLeave: () => void
}

export default function VideoCallRoom({ roomName, displayName, onLeave }: VideoCallRoomProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const [jitsiApi, setJitsiApi] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Load Jitsi script dynamically
    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.async = true
    script.onload = () => {
      if (!jitsiContainerRef.current) return

      const domain = 'meet.jit.si'
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: displayName
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false // Skip prejoin for smoother entry
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
            'security'
          ],
        }
      }

      // @ts-ignore
      const api = new window.JitsiMeetExternalAPI(domain, options)
      setJitsiApi(api)
      setLoading(false)

      api.addEventListeners({
        videoConferenceLeft: () => {
          onLeave()
        },
        readyToClose: () => {
          onLeave()
        }
      })
    }
    document.body.appendChild(script)

    return () => {
      if (jitsiApi) {
        jitsiApi.dispose()
      }
      document.body.removeChild(script)
    }
  }, [])

  const copyLink = () => {
    const url = `https://meet.jit.si/${roomName}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Live Consultation</h3>
            <p className="text-xs text-gray-400">Secure End-to-End Encrypted</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={copyLink}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-medium transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
          <button 
            onClick={onLeave}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-sm font-medium transition flex items-center gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            Leave Call
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-black">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3"></div>
            Connecting to secure room...
          </div>
        )}
        <div ref={jitsiContainerRef} className="w-full h-full" />
      </div>
    </div>
  )
}
