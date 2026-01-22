'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function CartIcon() {
  const [itemCount, setItemCount] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const fetchCartCount = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsAuthenticated(false)
        setItemCount(0)
        return
      }
      
      setIsAuthenticated(true)
      
      const { count, error } = await supabase
        .from('carts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (!error && count !== null) {
        setItemCount(count)
      }
    } catch (error) {
      console.error('Error fetching cart count:', error)
    }
  }, [])

  useEffect(() => {
    fetchCartCount()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCartCount()
    })

    // Listen for cart changes via custom event
    const handleCartUpdate = () => fetchCartCount()
    window.addEventListener('cart-updated', handleCartUpdate)

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchCartCount, 30000)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('cart-updated', handleCartUpdate)
      clearInterval(interval)
    }
  }, [fetchCartCount])

  return (
    <Link
      href="/cart"
      className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
      title="Shopping Cart"
    >
      <ShoppingCart className="w-5 h-5" />
      {isAuthenticated && itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-emerald-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  )
}
