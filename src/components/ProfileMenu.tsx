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
          <div className="py-1 text-sm overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Creator Tools */}
            {user.is_creator && (
              <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700/50">
                <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Creator</p>
                <Link 
                   href={`/creator/${user.username}/bio`} 
                   onClick={() => setOpen(false)}
                   className="block px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                   My Bio Page
                </Link>
                <Link 
                   href={`/creator/${user.username}`} 
                   onClick={() => setOpen(false)}
                   className="block px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                   My Store
                </Link>
                <Link 
                   href="/orders?tab=selling" 
                   onClick={() => setOpen(false)}
                   className="block px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                   Dashboard & Sales
                </Link>
              </div>
            )}

            {/* General / Buying */}
            <div className="px-3 py-2">
               {user.is_creator && (
                 <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Personal</p>
               )}
               <Link 
                  href="/profile" 
                  onClick={() => setOpen(false)}
                  className="block px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
               >
                  Account Settings
               </Link>
               <Link 
                  href="/orders" 
                  onClick={() => setOpen(false)}
                  className="block px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
               >
                  My Purchases
               </Link>
               {!user.is_creator && (
                  <Link 
                    href="/auth/creator-signup" 
                    onClick={() => setOpen(false)}
                    className="block px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-emerald-600 dark:text-emerald-400 font-medium"
                  >
                    Become a Creator
                  </Link>
               )}
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700/50 p-2">
            <button 
                onClick={async ()=>{ 
                    setOpen(false); 
                    await supabase.auth.signOut(); 
                    location.href='/'; 
                }} 
                className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
                Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
