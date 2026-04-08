'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function StartSellingButton({ isCTA = false }: { isCTA?: boolean }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const buttonClasses = isCTA
    ? "block w-full sm:w-auto border border-white/20 dark:border-gray-900/20 bg-white/5 dark:bg-gray-900/5 text-white dark:text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-white dark:hover:bg-gray-100 hover:text-emerald-900 dark:hover:text-emerald-700 transition-all duration-200 hover:scale-105 transform text-center flex items-center justify-center"
    : "block w-full sm:w-auto border border-white/20 bg-white/5 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-emerald-900 transition-all duration-200 hover:scale-105 transform text-center"


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
      <button className={`${buttonClasses} opacity-50 cursor-wait`} disabled>
        Loading...
      </button>
    )
  }

  if (user) {
    return (
      <Link
        href="/orders?tab=selling"
        prefetch
        className={buttonClasses}
      >
        Creator Dashboard
      </Link>
    )
  }

  return (
    <Link
      href="/auth/login"
      prefetch
      className={buttonClasses}
    >
      Start Selling
    </Link>
  )
}
