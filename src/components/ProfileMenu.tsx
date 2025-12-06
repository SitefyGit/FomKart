"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const rootRef = useRef<HTMLDivElement | null>(null)

  // Function to fetch user profile
  const fetchUserProfile = async (authUser: any) => {
    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }
    const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    setUser(data || authUser)
    setLoading(false)
  }

  useEffect(() => {
    // Initial fetch
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      fetchUserProfile(authUser)
    })

    // Listen for auth state changes (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserProfile(session?.user || null)
    })

    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      subscription.unsubscribe()
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
    )
  }

  if (!user) {
    return (
      <div>
        <Link href="/auth/login" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm">Sign in</Link>
      </div>
    )
  }

  const avatar = user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.full_name || user.username || 'User')}`

  return (
    <div className="relative" ref={rootRef}>
      <button onClick={()=>setOpen(v=>!v)} className="h-8 pl-1 pr-2 rounded-full flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
        <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{user.full_name || user.username}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
          </div>
          <div className="py-1 text-sm">
            {user.is_creator ? (
              <Link href={`/creator/${user.username || user.id}`} className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Creator profile</Link>
            ) : (
              <Link href="/profile" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Your profile</Link>
            )}
            <Link href="/orders" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Orders</Link>
            {user.is_creator ? (
              <Link href="/orders?tab=selling" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">Creator dashboard</Link>
            ) : (
              <Link href="/auth/creator-signup" className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Become a creator</Link>
            )}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
            <button onClick={async ()=>{ await supabase.auth.signOut(); location.href='/'; }} className="w-full text-left text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">Sign out</button>
          </div>
        </div>
      )}
    </div>
  )
}
