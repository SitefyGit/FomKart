'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function StartSellingButton() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <button className="border-2 border-white text-white px-6 sm:px-8 py-3 rounded-lg font-semibold opacity-50 cursor-wait">
        Loading...
      </button>
    )
  }

  if (user) {
    return (
      <Link
        href="/orders?tab=selling"
        prefetch
        className="border-2 border-white text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-all duration-200 hover:scale-105 transform text-center"
      >
        Creator Dashboard
      </Link>
    )
  }

  return (
    <Link
      href="/auth/login"
      prefetch
      className="border-2 border-white text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-all duration-200 hover:scale-105 transform text-center"
    >
      Start Selling
    </Link>
  )
}
