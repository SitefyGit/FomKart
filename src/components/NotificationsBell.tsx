"use client"

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Check, Loader2, PackageOpen, BadgeCheck, RefreshCcw, ClipboardList, ShoppingCart, MessageCircle } from 'lucide-react'
import { supabase, listNotifications, markNotificationRead, markAllNotificationsRead, type Notification } from '@/lib/supabase'
import { ToastContainer, type ToastItem } from './Toast'

export default function NotificationsBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [items, setItems] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const rootRef = useRef<HTMLDivElement | null>(null)

  const unread = useMemo(() => items.filter(i => !i.is_read).length, [items])

  const pushToast = (type: ToastItem['type'], message: string, title?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, title, message }])
  }

  useEffect(() => {
    setMounted(true)
    let channel: any
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)
  const list = await listNotifications(user.id, 20)
  // Ensure shape contains is_read boolean
  setItems(list.map(n => ({ ...n, is_read: !!(n as any).is_read })))
      setLoading(false)
      // Realtime for new notifications
      channel = supabase.channel(`notifs-${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload: any) => {
          const n = payload.new as Notification
          setItems(prev => [n, ...prev])
          // Show a toast
          pushToast('info', n.message, n.title)
        })
        .subscribe()
    }
    init()
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      if (channel) supabase.removeChannel(channel)
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const markOne = async (id: string) => {
  const ok = await markNotificationRead(id)
  if (ok) setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAll = async () => {
    if (!userId) return
  const ok = await markAllNotificationsRead(userId)
  if (ok) setItems(prev => prev.map(n => n.is_read ? n : { ...n, is_read: true }))
  }

  const onOpenNotification = async (n: Notification) => {
    if (!n.is_read) {
      // Optimistic update
      setItems(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
      markNotificationRead(n.id)
    }
    // Navigate if we have a deep link
    const orderId = (n as any)?.data?.order_id
    if (orderId) {
      setOpen(false)
      router.push(`/orders/${orderId}`)
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button onClick={() => setOpen(v => !v)} className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {mounted && userId && unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">{unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
          <div className="px-4 py-3 border-b bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 z-10">
            <div className="text-sm font-bold text-gray-900 dark:text-white">Notifications</div>
            {mounted && userId ? (
              <button onClick={markAll} className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">Mark all as read</button>
            ) : null}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {!mounted ? (
              <div className="p-8 text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center gap-3"><Loader2 className="w-6 h-6 animate-spin text-gray-400"/> Loading...</div>
            ) : !userId ? (
              <div className="p-8 text-center text-sm text-gray-600 dark:text-gray-400">
                <div className="font-semibold mb-2 text-gray-900 dark:text-white">You're not signed in</div>
                <div className="mb-4">Sign in to receive order updates and alerts.</div>
                <div><Link href="/auth/login" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors">Sign in</Link></div>
              </div>
            ) : loading ? (
              <div className="p-8 text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center gap-3"><Loader2 className="w-6 h-6 animate-spin text-gray-400"/> Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2"><Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-1" /><p>No notifications yet</p></div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map(n => {
                  let Icon = Bell
                  if (n.type === 'delivery_posted') Icon = PackageOpen
                  else if (n.type === 'order_approved') Icon = BadgeCheck
                  else if (n.type === 'revision_requested') Icon = RefreshCcw
                  else if (n.type === 'requirements_submitted') Icon = ClipboardList
                  else if (n.type === 'order_placed') Icon = ShoppingCart
                  else if (n.type === 'order_message') Icon = MessageCircle
                  const accent = n.type === 'order_approved' ? 'bg-green-600' :
                                  n.type === 'delivery_posted' ? 'bg-indigo-600' :
                                  n.type === 'revision_requested' ? 'bg-amber-600' :
                                  n.type === 'order_message' ? 'bg-violet-600' :
                                  'bg-blue-600'
                  return (
                    <li key={n.id} className="relative">
                      <button type="button" onClick={() => onOpenNotification(n)} className={`w-full text-left text-sm transition-all duration-200 flex items-start gap-4 p-4 ${n.is_read ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50' : 'bg-emerald-50/40 dark:bg-emerald-500/[0.04] hover:bg-emerald-50 dark:hover:bg-emerald-500/[0.08]'}` }>
                        <div className={`shrink-0 mt-0.5 w-10 h-10 rounded-full flex items-center justify-center ${n.is_read ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <div className={`font-semibold ${n.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'} leading-snug mb-0.5`}>{n.title}</div>
                          <div className="text-gray-600 dark:text-gray-400 line-clamp-2">{n.message}</div>
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                              {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(n.created_at))}
                            </span>
                            {n.data?.order_id && (
                              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium hover:underline">View order</span>
                            )}
                          </div>
                        </div>
                        {!n.is_read && (
                          <div className="shrink-0 w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} onClose={(id)=> setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  )
}


