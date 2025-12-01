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
        <Link href="/auth/login" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border hover:bg-gray-50 text-sm">Sign in</Link>
      </div>
    )
  }

  const avatar = user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.full_name || user.username || 'User')}`

  return (
    <div className="relative" ref={rootRef}>
      <button onClick={()=>setOpen(v=>!v)} className="h-8 pl-1 pr-2 rounded-full flex items-center gap-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b">
            <div className="text-sm font-semibold text-gray-900">{user.full_name || user.username}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
          <div className="py-1 text-sm">
            {user.is_creator ? (
              <Link href={`/creator/${user.username || user.id}`} className="block px-4 py-2 hover:bg-gray-50">Creator profile</Link>
            ) : (
              <Link href="/profile" className="block px-4 py-2 hover:bg-gray-50">Your profile</Link>
            )}
            <Link href="/orders" className="block px-4 py-2 hover:bg-gray-50">Orders</Link>
            {user.is_creator ? (
              <Link href="/orders?tab=selling" className="block px-4 py-2 hover:bg-gray-50">Creator dashboard</Link>
            ) : (
              <Link href="/auth/creator-login" className="block px-4 py-2 hover:bg-gray-50">Become a creator</Link>
            )}
          </div>
          <div className="border-t px-4 py-2">
            <button onClick={async ()=>{ await supabase.auth.signOut(); location.href='/'; }} className="w-full text-left text-sm text-red-600 hover:text-red-700">Sign out</button>
          </div>
        </div>
      )}
    </div>
  )
}
