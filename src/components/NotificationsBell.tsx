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
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b bg-gray-50/80 dark:bg-gray-900/50 dark:border-gray-700 flex items-center justify-between sticky top-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</div>
            {mounted && userId ? (
              <button onClick={markAll} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Mark all read</button>
            ) : null}
          </div>
          <div className="max-h-96 overflow-auto">
            {!mounted ? (
              <div className="p-4 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Loading…</div>
            ) : !userId ? (
              <div className="p-6 text-sm text-gray-700 dark:text-gray-300">
                <div className="font-medium mb-1 dark:text-white">You're not signed in</div>
                <div>Sign in to receive order updates and alerts.</div>
                <div className="mt-3"><Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">Sign in</Link></div>
              </div>
            ) : loading ? (
              <div className="p-4 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-6 text-sm text-gray-600 dark:text-gray-400">No notifications</div>
            ) : (
              <ul className="divide-y divide-gray-100 px-2 py-2">
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
                    <li key={n.id} className="p-1">
                      <button type="button" onClick={() => onOpenNotification(n)} className={`w-full text-left text-sm rounded-lg border ${n.is_read ? 'border-transparent' : 'border-blue-100'} ${n.is_read ? 'bg-white' : 'bg-blue-50/60'} hover:bg-gray-50 transition-colors flex items-start gap-3 p-3` }>
                        <div className="flex items-stretch gap-3 min-w-0 flex-1">
                          <div className={`w-1 rounded ${accent} ${n.is_read ? 'opacity-30' : 'opacity-70'}`} />
                          <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${n.is_read ? 'bg-gray-100' : 'bg-white' } border ${n.is_read ? 'border-gray-200' : 'border-blue-200' }`}>
                            <Icon className={`w-4 h-4 ${n.is_read ? 'text-gray-600' : 'text-blue-700'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 leading-tight">{n.title}</div>
                            <div className="text-gray-700 truncate">{n.message}</div>
                            <div className="text-[11px] text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                            {n.data?.order_id && (
                              <span className="text-blue-600 text-xs">Open order</span>
                            )}
                          </div>
                        </div>
                        <div className="pl-2 shrink-0">
                          <span className="text-[11px] text-gray-500 inline-flex items-center gap-1"><Check className="w-3 h-3"/> {n.is_read ? 'Read' : 'New'}</span>
                        </div>
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
