'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

export default function AnnouncementBanner() {
  const [message, setMessage] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    fetchBanner()
  }, [])

  const fetchBanner = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'announcement_banner')
        .single()

      if (data?.value && data.value !== '""' && data.value !== '') {
        // Remove quotes if they exist (Supabase sometimes stores strings with quotes in JSONB)
        const cleanMessage = String(data.value).replace(/^"|"$/g, '')
        if (cleanMessage) {
          setMessage(cleanMessage)
        }
      }
    } catch (error) {
      console.error('Failed to fetch announcement banner:', error)
    }
  }

  if (!message || !isVisible) return null

  return (
    <div className="bg-indigo-600 text-white px-4 py-3 relative z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex-1 text-center text-sm font-medium">
          {message}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-indigo-500 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
