"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getUserOrders } from '@/lib/supabase'
import { UserCircle2, Mail, MapPin, Link as LinkIcon, Save, Loader2, ShoppingBag, BadgeCheck, Clock } from 'lucide-react'
import { ToastContainer, type ToastItem } from '@/components/Toast'

type TabKey = 'overview' | 'edit'

export default function BuyerProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [tab, setTab] = useState<TabKey>('overview')
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    website: '',
    location: ''
  })
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const pushToast = (type: ToastItem['type'], message: string, title?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, title, message }])
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      // Load profile
      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (error || !data) { router.push('/auth/login'); return }
      setUser(data)
      setForm({
        full_name: data.full_name || '',
        username: data.username || '',
        bio: data.bio || '',
        website: data.website || '',
        location: data.location || ''
      })
      // Load buyer orders for overview
      const buyerOrders = await getUserOrders(user.id, 'buyer')
      setOrders(buyerOrders)
      setLoading(false)
    })()
  }, [router])

  const stats = useMemo(() => {
    const total = orders.length
    const completed = orders.filter((o:any)=> o.status === 'completed').length
    const open = orders.filter((o:any)=> !['completed','cancelled','refunded'].includes(o.status)).length
    const spent = orders.reduce((sum:number, o:any)=> sum + (Number(o.total_price)||0), 0)
    return { total, completed, open, spent }
  }, [orders])

  const onSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: form.full_name,
          username: form.username,
          bio: form.bio,
          website: form.website,
          location: form.location
        })
        .eq('id', user.id)
      if (!error) { router.refresh(); pushToast('success','Your profile has been updated') }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-600"><Loader2 className="w-6 h-6 animate-spin inline-block mr-2"/> Loading profile…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Your Profile</h1>
              <p className="text-gray-600">Manage your account details</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setTab('overview')} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${tab==='overview'?'bg-blue-600 text-white border-blue-600 shadow-sm':'bg-white text-gray-800 hover:bg-gray-50 border-gray-200'}`}>Overview</button>
              <button onClick={()=>setTab('edit')} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${tab==='edit'?'bg-blue-600 text-white border-blue-600 shadow-sm':'bg-white text-gray-800 hover:bg-gray-50 border-gray-200'}`}>Edit Profile</button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {tab === 'overview' ? (
          <>
            {/* Profile Header */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name || user.username} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 className="w-10 h-10 text-gray-400"/>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-semibold text-gray-900">{user.full_name || user.username}</div>
                  <div className="text-sm text-gray-600">@{user.username}</div>
                  <div className="mt-2 text-gray-800 whitespace-pre-wrap">{user.bio || 'No bio provided yet.'}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="inline-flex items-center gap-1"><Mail className="w-4 h-4"/>{user.email}</div>
                    {user.location && <div className="inline-flex items-center gap-1"><MapPin className="w-4 h-4"/>{user.location}</div>}
                    {user.website && <div className="inline-flex items-center gap-1"><LinkIcon className="w-4 h-4"/><a href={user.website} target="_blank" className="text-blue-600 hover:underline">{user.website}</a></div>}
                    <div className="inline-flex items-center gap-1 text-gray-500">Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-sm text-gray-600">Total orders</div>
                <div className="mt-1 text-2xl font-semibold">{stats.total}</div>
                <div className="mt-2 text-xs text-gray-500 inline-flex items-center gap-1"><ShoppingBag className="w-3 h-3"/> Purchases</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-sm text-gray-600">Completed</div>
                <div className="mt-1 text-2xl font-semibold">{stats.completed}</div>
                <div className="mt-2 text-xs text-gray-500 inline-flex items-center gap-1"><BadgeCheck className="w-3 h-3"/> Finished</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-sm text-gray-600">Open</div>
                <div className="mt-1 text-2xl font-semibold">{stats.open}</div>
                <div className="mt-2 text-xs text-gray-500 inline-flex items-center gap-1"><Clock className="w-3 h-3"/> In progress</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-sm text-gray-600">Total spent</div>
                <div className="mt-1 text-2xl font-semibold">${stats.spent.toFixed(2)}</div>
                <div className="mt-2 text-xs text-gray-500">Across all purchases</div>
              </div>
            </div>

            {/* Recent orders */}
            <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent orders</h2>
                <a href="/orders" className="text-sm text-blue-600 hover:underline">View all</a>
              </div>
              <div className="divide-y divide-gray-100">
                {orders.slice(0,5).map((o:any) => (
                  <a key={o.id} href={`/orders/${o.id}`} className="px-6 py-4 flex items-center gap-3 hover:bg-gray-50">
                    <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                      {o.product?.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.product.images[0]} alt="thumb" className="w-full h-full object-cover"/>
                      ) : (
                        <span className="text-xs text-gray-400">No image</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{o.product?.title || 'Product'}</div>
                      <div className="text-xs text-gray-600">Placed {o.created_at ? new Date(o.created_at).toLocaleString() : ''}</div>
                    </div>
                    <div>
                      <span className="px-2 py-1 rounded-full text-xs capitalize bg-gray-100 text-gray-800">{(o.status||'confirmed').replace('_',' ')}</span>
                    </div>
                  </a>
                ))}
                {orders.length === 0 && (
                  <div className="px-6 py-10 text-sm text-gray-600">No orders yet. Explore services to get started.</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserCircle2 className="w-10 h-10 text-gray-400"/>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Signed in as</div>
                  <div className="text-gray-900 font-medium">{user.email}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full name</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={form.full_name} onChange={e=>setForm(f=>({...f, full_name:e.target.value}))}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={form.username} onChange={e=>setForm(f=>({...f, username:e.target.value}))}/>
                  <div className="text-xs text-gray-500 mt-1">Your public handle; also used for your creator URL if you enable creator mode.</div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={form.bio} onChange={e=>setForm(f=>({...f, bio:e.target.value}))}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 gap-2">
                    <LinkIcon className="w-4 h-4 text-gray-500"/>
                    <input className="flex-1 outline-none" value={form.website} onChange={e=>setForm(f=>({...f, website:e.target.value}))} placeholder="https://"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 gap-2">
                    <MapPin className="w-4 h-4 text-gray-500"/>
                    <input className="flex-1 outline-none" value={form.location} onChange={e=>setForm(f=>({...f, location:e.target.value}))} placeholder="City, Country"/>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  Save changes
                </button>
              </div>
            </div>

            <div className="mt-8 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-3">Purchases & sales</h2>
              <p className="text-sm text-gray-600">Visit the Orders page to view your purchases and sales activity.</p>
              <div className="mt-3">
                <a href="/orders" className="text-blue-600 hover:underline text-sm">Go to Orders</a>
              </div>
            </div>
          </>
        )}
      </div>
      <ToastContainer toasts={toasts} onClose={(id)=> setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  )
}
