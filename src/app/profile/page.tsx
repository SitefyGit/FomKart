"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getUserOrders } from '@/lib/supabase'
import { UserCircle2, Mail, MapPin, Link as LinkIcon, Save, Loader2, ShoppingBag, BadgeCheck, Clock, Camera, Store, CheckCircle2, Sparkles, Instagram, Youtube, Facebook } from 'lucide-react'
import { ToastContainer, type ToastItem } from '@/components/Toast'
import { FaTiktok, FaSpotify } from 'react-icons/fa'

type TabKey = 'overview' | 'edit'

export default function BuyerProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [tab, setTab] = useState<TabKey>('overview')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    website: '',
    location: '',
    social_links: {
      instagram: '',
      tiktok: '',
      youtube: '',
      facebook: '',
      spotify: ''
    } as Record<string, string>
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
      const existingSocial = data.social_links || {}
      setForm({
        full_name: data.full_name || '',
        username: data.username || '',
        bio: data.bio || '',
        website: data.website || '',
        location: data.location || '',
        social_links: {
          instagram: existingSocial.instagram || '',
          tiktok: existingSocial.tiktok || '',
          youtube: existingSocial.youtube || '',
          facebook: existingSocial.facebook || '',
          spotify: existingSocial.spotify || ''
        }
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
      // Filter out empty social links
      const cleanedSocialLinks: Record<string, string> = {}
      for (const [key, value] of Object.entries(form.social_links)) {
        if (value && value.trim()) {
          cleanedSocialLinks[key] = value.trim()
        }
      }
      
      const { error } = await supabase
        .from('users')
        .update({
          full_name: form.full_name,
          username: form.username,
          bio: form.bio,
          website: form.website,
          location: form.location,
          social_links: cleanedSocialLinks
        })
        .eq('id', user.id)
      if (!error) { router.refresh(); pushToast('success','Your profile has been updated') }
    } finally {
      setSaving(false)
    }
  }

  const onAvatarSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!user) return
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      setAvatarUploading(true)
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${user.id}/profile/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, cacheControl: '3600' })
      if (uploadError) throw uploadError
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = publicUrlData?.publicUrl ? `${publicUrlData.publicUrl}?v=${Date.now()}` : null
      if (!publicUrl) throw new Error('Missing public URL for uploaded avatar')
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
      if (updateError) throw updateError
      setUser((prev: any) => (prev ? { ...prev, avatar_url: publicUrl } : prev))
      pushToast('success', 'Profile photo updated')
    } catch (error) {
      console.error('Failed to update avatar', error)
      pushToast('error', 'Could not update profile picture', 'Upload failed')
    } finally {
      setAvatarUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-600 dark:text-gray-400"><Loader2 className="w-6 h-6 animate-spin inline-block mr-2"/> Loading profile…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold dark:text-white">Your Profile</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your account details</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setTab('overview')} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${tab==='overview'?'bg-blue-600 text-white border-blue-600 shadow-sm':'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'}`}>Overview</button>
              <button onClick={()=>setTab('edit')} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${tab==='edit'?'bg-blue-600 text-white border-blue-600 shadow-sm':'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'}`}>Edit Profile</button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {tab === 'overview' ? (
          <>
            {/* Profile Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name || user.username} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 className="w-10 h-10 text-gray-400 dark:text-gray-500"/>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">{user.full_name || user.username}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">@{user.username}</div>
                  <div className="mt-2 text-gray-800 dark:text-gray-300 whitespace-pre-wrap">{user.bio || 'No bio provided yet.'}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="inline-flex items-center gap-1"><Mail className="w-4 h-4"/>{user.email}</div>
                    {user.location && <div className="inline-flex items-center gap-1"><MapPin className="w-4 h-4"/>{user.location}</div>}
                    {user.website && <div className="inline-flex items-center gap-1"><LinkIcon className="w-4 h-4"/><a href={user.website} target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">{user.website}</a></div>}
                    <div className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-500">Joined {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total orders</div>
                <div className="mt-1 text-2xl font-semibold dark:text-white">{stats.total}</div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 inline-flex items-center gap-1"><ShoppingBag className="w-3 h-3"/> Purchases</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                <div className="mt-1 text-2xl font-semibold dark:text-white">{stats.completed}</div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 inline-flex items-center gap-1"><BadgeCheck className="w-3 h-3"/> Finished</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Open</div>
                <div className="mt-1 text-2xl font-semibold dark:text-white">{stats.open}</div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 inline-flex items-center gap-1"><Clock className="w-3 h-3"/> In progress</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total spent</div>
                <div className="mt-1 text-2xl font-semibold dark:text-white">${stats.spent.toFixed(2)}</div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">Across all purchases</div>
              </div>
            </div>

            {/* Recent orders */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold dark:text-white">Recent orders</h2>
                <a href="/orders" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all</a>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {orders.slice(0,5).map((o:any) => (
                  <a key={o.id} href={`/orders/${o.id}`} className="px-6 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                      {o.product?.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.product.images[0]} alt="thumb" className="w-full h-full object-cover"/>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">No image</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{o.product?.title || 'Product'}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Placed {o.created_at ? new Date(o.created_at).toLocaleString() : ''}</div>
                    </div>
                    <div>
                      <span className="px-2 py-1 rounded-full text-xs capitalize bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{(o.status||'confirmed').replace('_',' ')}</span>
                    </div>
                  </a>
                ))}
                {orders.length === 0 && (
                  <div className="px-6 py-10 text-sm text-gray-600 dark:text-gray-400">No orders yet. Explore services to get started.</div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <UserCircle2 className="w-10 h-10 text-gray-400 dark:text-gray-500"/>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Signed in as</div>
                  <div className="text-gray-900 dark:text-white font-medium">{user.email}</div>
                  <div className="mt-3">
                    <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition dark:text-gray-300">
                      <Camera className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span>{avatarUploading ? 'Uploading…' : 'Update profile photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onAvatarSelected}
                        disabled={avatarUploading}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Full name</label>
                  <input className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={form.full_name} onChange={e=>setForm(f=>({...f, full_name:e.target.value}))}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Username</label>
                  <input className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={form.username} onChange={e=>setForm(f=>({...f, username:e.target.value}))}/>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Your public handle; also used for your creator URL if you enable creator mode.</div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Bio</label>
                  <textarea className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value={form.bio} onChange={e=>setForm(f=>({...f, bio:e.target.value}))}/>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Website</label>
                  <div className="flex items-center border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 gap-2">
                    <LinkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400"/>
                    <input className="flex-1 outline-none dark:bg-gray-700 dark:text-white" value={form.website} onChange={e=>setForm(f=>({...f, website:e.target.value}))} placeholder="https://"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Location</label>
                  <div className="flex items-center border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400"/>
                    <input className="flex-1 outline-none dark:bg-gray-700 dark:text-white" value={form.location} onChange={e=>setForm(f=>({...f, location:e.target.value}))} placeholder="City, Country"/>
                  </div>
                </div>
              </div>

              {/* Social Media Links Section */}
              {user?.is_creator && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Social Media Links</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Add your social media handles. These will appear on your bio page.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">Instagram</label>
                      <div className="flex items-center border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 gap-2">
                        <Instagram className="w-4 h-4 text-pink-500"/>
                        <input 
                          className="flex-1 outline-none dark:bg-gray-700 dark:text-white" 
                          value={form.social_links.instagram} 
                          onChange={e=>setForm(f=>({...f, social_links: {...f.social_links, instagram: e.target.value}}))} 
                          placeholder="@username"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">TikTok</label>
                      <div className="flex items-center border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 gap-2">
                        <FaTiktok className="w-4 h-4 text-gray-800 dark:text-white"/>
                        <input 
                          className="flex-1 outline-none dark:bg-gray-700 dark:text-white" 
                          value={form.social_links.tiktok} 
                          onChange={e=>setForm(f=>({...f, social_links: {...f.social_links, tiktok: e.target.value}}))} 
                          placeholder="@username"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">YouTube</label>
                      <div className="flex items-center border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 gap-2">
                        <Youtube className="w-4 h-4 text-red-500"/>
                        <input 
                          className="flex-1 outline-none dark:bg-gray-700 dark:text-white" 
                          value={form.social_links.youtube} 
                          onChange={e=>setForm(f=>({...f, social_links: {...f.social_links, youtube: e.target.value}}))} 
                          placeholder="@channel or channel/ID"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">Facebook</label>
                      <div className="flex items-center border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 gap-2">
                        <Facebook className="w-4 h-4 text-blue-600"/>
                        <input 
                          className="flex-1 outline-none dark:bg-gray-700 dark:text-white" 
                          value={form.social_links.facebook} 
                          onChange={e=>setForm(f=>({...f, social_links: {...f.social_links, facebook: e.target.value}}))} 
                          placeholder="username or page"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-gray-300">Spotify</label>
                      <div className="flex items-center border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-3 py-2 gap-2">
                        <FaSpotify className="w-4 h-4 text-green-500"/>
                        <input 
                          className="flex-1 outline-none dark:bg-gray-700 dark:text-white" 
                          value={form.social_links.spotify} 
                          onChange={e=>setForm(f=>({...f, social_links: {...f.social_links, spotify: e.target.value}}))} 
                          placeholder="artist/ID or show/ID"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  Save changes
                </button>
              </div>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-3 dark:text-white">Purchases & sales</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Visit the Orders page to view your purchases and sales activity.</p>
              <div className="mt-3">
                <a href="/orders" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">Go to Orders</a>
              </div>
            </div>

            {/* Become a Seller Section */}
            {!user.is_creator ? (
              <div className="mt-8 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Store className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Start Selling on FomKart</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Turn your skills into income! Create your own storefront, list your services or products, and reach thousands of potential buyers.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Free to start</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Set your own prices</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Keep 90% of earnings</span>
                      </div>
                    </div>
                    <div className="mt-5">
                      <a 
                        href="/auth/creator-signup" 
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                      >
                        <Sparkles className="w-4 h-4" />
                        Become a Seller
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Store className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Seller Dashboard</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      You&apos;re a verified seller on FomKart. Manage your products, view analytics, and grow your business.
                    </p>
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{user.total_sales || 0}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Sales</div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">${(user.total_earnings || 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Earnings</div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{(user.rating || 0).toFixed(1)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Rating</div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 capitalize">{user.subscription_tier}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Tier</div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <a 
                        href={`/creator/${user.username}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                      >
                        View My Store
                      </a>
                      <a 
                        href="/orders?tab=seller"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Manage Orders
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <ToastContainer toasts={toasts} onClose={(id)=> setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  )
}
