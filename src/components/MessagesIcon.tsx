'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function MessagesIcon() {
  const [hasUnread, setHasUnread] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const checkUnreadMessages = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsAuthenticated(false)
        setHasUnread(false)
        return
      }
      
      setIsAuthenticated(true)
      
      // Check for unread message notifications
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'direct_message')
        .eq('is_read', false)
      
      if (!error && count && count > 0) {
        setHasUnread(true)
      } else {
        setHasUnread(false)
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error)
    }
  }, [])

  useEffect(() => {
    checkUnreadMessages()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUnreadMessages()
    })

    // Poll for unread messages since realtime might not be working
    const interval = setInterval(checkUnreadMessages, 5000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [checkUnreadMessages])

  // If they are not authenticated, they don't need a quick messages link
  if (!isAuthenticated) return null;

  return (
    <Link
      href="/messages"
      className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
      title="Messages"
    >
      <MessageCircle className="w-5 h-5" />
      {hasUnread && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full border border-white dark:border-gray-800"></span>
      )}
    </Link>
  )
}
