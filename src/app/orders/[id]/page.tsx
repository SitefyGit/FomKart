'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Clock, ArrowLeft, Paperclip, Send, AlertCircle, Upload, PackageOpen, Copy, Info, Megaphone, RefreshCcw, BadgeCheck, Video, Phone } from 'lucide-react'
import { getOrderById, getOrderMessages, listDeliverables, sendOrderMessage, createDeliverable, updateOrderStatus, updateOrderRequirements, createNotification, supabase } from '@/lib/supabase'
import { ToastContainer, type ToastItem } from '@/components/Toast'
import WebRTCVideoCall from '@/components/WebRTCVideoCall'

type TabKey = 'activity' | 'details' | 'requirements' | 'delivery'

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export default function OrderPage({ params }: OrderPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [order, setOrder] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>('activity')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [compose, setCompose] = useState('')
  const [attachments, setAttachments] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeliverModal, setShowDeliverModal] = useState(false)
  const [deliveryNote, setDeliveryNote] = useState('')
  const [deliveryFiles, setDeliveryFiles] = useState<FileList | null>(null)
  const [reqForm, setReqForm] = useState({ details: '', urls: '', notes: '' })
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [showBilling, setShowBilling] = useState(false)
  const [existingReview, setExistingReview] = useState<any>(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', sellerRating: 0, sellerComment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [inCall, setInCall] = useState(false)
  const [callActive, setCallActive] = useState(false)
  const [callType, setCallType] = useState<'video' | 'audio'>('video')

  const pushToast = (type: ToastItem['type'], message: string, title?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, title, message }])
  }

  const router = useRouter()
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params
      setResolvedParams(resolved)
    }
    resolveParams()
  }, [params])

  // Check for active call presence
  useEffect(() => {
    if (!resolvedParams?.id || inCall) return
    
    // Must match the channel name used in WebRTCVideoCall component
    const channel = supabase.channel(`video-call-presence-${resolvedParams.id}`)
    channel
      .on('broadcast', { event: 'call-status' }, ({ payload }) => {
        setCallActive(payload.active)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [resolvedParams?.id, inCall])

  useEffect(() => {
    if (!resolvedParams?.id) return
    (async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user || null)
        const ord = await getOrderById(resolvedParams.id)
        if (!ord) {
          router.push('/orders')
          return
        }
        setOrder(ord)
        const [msgs, dels] = await Promise.all([
          getOrderMessages(resolvedParams.id),
          listDeliverables(resolvedParams.id)
        ])
        setMessages(msgs)
        setDeliveries(dels)
        if (user && ord?.buyer?.id === user.id) {
          const { data: reviewRow } = await supabase
            .from('reviews')
            .select('id,rating,comment,seller_rating,seller_comment')
            .eq('order_id', ord.id)
            .eq('reviewer_id', user.id)
            .maybeSingle()
          if (reviewRow) {
            setExistingReview(reviewRow)
            setReviewForm({
              rating: reviewRow.rating ?? 5,
              comment: reviewRow.comment ?? '',
              sellerRating: reviewRow.seller_rating ?? 0,
              sellerComment: reviewRow.seller_comment ?? ''
            })
          }
        }
      } catch (e) {
        console.warn('Order load failed', e)
        setError('Failed to load order')
      } finally {
        setLoading(false)
      }
    })()
  }, [resolvedParams?.id, router])

  // Realtime subscriptions for messages and deliverables
  useEffect(() => {
    if (!resolvedParams?.id) return
    const channel = supabase.channel(`order-${resolvedParams.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${resolvedParams.id}` }, (payload:any) => {
        setMessages(prev => {
          const exists = prev.some(m => m.id === payload.new.id)
          return exists ? prev : [...prev, payload.new]
        })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_deliverables', filter: `order_id=eq.${resolvedParams.id}` }, async (_payload:any) => {
        const dels = await listDeliverables(resolvedParams.id)
        setDeliveries(dels)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${resolvedParams.id}` }, (payload:any) => {
        setOrder((o:any)=> ({ ...o, ...payload.new }))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [resolvedParams?.id])

  const orderShort = useMemo(() => (order?.id ? order.id.substring(0,8) : ''), [order?.id])
  const expectedDate = order?.expected_delivery ? new Date(order.expected_delivery).toLocaleDateString() : null
  const isBuyer = !!(currentUser && order?.buyer?.id && currentUser.id === order.buyer.id)
  const isSeller = !!(currentUser && order?.seller?.id && currentUser.id === order.seller.id)
  const approveBy = order?.approve_by ? new Date(order.approve_by) : null
  const approveByLabel = approveBy ? approveBy.toLocaleString() : null
  const overdue = approveBy ? Date.now() > approveBy.getTime() : false
  const canReview = isBuyer && (order?.status === 'completed' || order?.status === 'delivered')
  const hasSubmittedReview = !!existingReview

  const handleSubmitReview = async () => {
    if (!order || !currentUser) return
    if (hasSubmittedReview) return
    if (!reviewForm.rating) {
      pushToast('error', 'Please provide a product rating first.')
      return
    }
    const productId = order.product?.id || order.product_id
    const sellerId = order.seller?.id
    if (!productId || !sellerId) {
      pushToast('error', 'Unable to submit a review for this order right now.')
      return
    }
    try {
      setSubmittingReview(true)
      const payload = {
        order_id: order.id,
        product_id: productId,
        seller_id: sellerId,
        reviewer_id: currentUser.id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment?.trim() || null,
        seller_rating: reviewForm.sellerRating ? Number(reviewForm.sellerRating) : null,
        seller_comment: reviewForm.sellerComment?.trim() || null,
        is_public: true
      }
      const { error: insertError } = await supabase.from('reviews').insert(payload)
      if (insertError) throw insertError
      const { data: freshReview } = await supabase
        .from('reviews')
        .select('id,rating,comment,seller_rating,seller_comment')
        .eq('order_id', order.id)
        .eq('reviewer_id', currentUser.id)
        .maybeSingle()
      if (freshReview) {
        setExistingReview(freshReview)
        setReviewForm({
          rating: freshReview.rating ?? reviewForm.rating,
          comment: freshReview.comment ?? reviewForm.comment,
          sellerRating: freshReview.seller_rating ?? reviewForm.sellerRating,
          sellerComment: freshReview.seller_comment ?? reviewForm.sellerComment
        })
      }
      try {
        const { data: productRatings } = await supabase
          .from('reviews')
          .select('rating')
          .eq('product_id', productId)
          .eq('is_public', true)
        if (productRatings) {
          const ratings = productRatings
            .map((row: { rating: number | null }) => (typeof row.rating === 'number' ? row.rating : null))
            .filter((value): value is number => value !== null)
          const reviewCount = ratings.length
          const average = reviewCount ? Number((ratings.reduce((sum, value) => sum + value, 0) / reviewCount).toFixed(2)) : 0
          await supabase
            .from('products')
            .update({ rating: average, reviews_count: reviewCount })
            .eq('id', productId)
        }
        const { data: sellerRatings } = await supabase
          .from('reviews')
          .select('seller_rating,rating')
          .eq('seller_id', sellerId)
          .eq('is_public', true)
        if (sellerRatings) {
          const validSellerRatings = sellerRatings
            .map((row: { seller_rating: number | null; rating?: number | null }) => {
              if (typeof row.seller_rating === 'number' && row.seller_rating > 0) return row.seller_rating
              if (typeof row.rating === 'number' && row.rating > 0) return row.rating
              return null
            })
            .filter((value): value is number => value !== null)
          const sellerReviewCount = validSellerRatings.length
          const sellerAverage = sellerReviewCount ? Number((validSellerRatings.reduce((sum, value) => sum + value, 0) / sellerReviewCount).toFixed(2)) : 0
          await supabase
            .from('users')
            .update({ rating: sellerAverage, total_reviews: sellerReviewCount })
            .eq('id', sellerId)
        }
      } catch (aggError) {
        console.warn('Failed to update aggregated ratings', aggError)
      }
      if (order.seller?.id) {
        try {
          await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: order.seller.id,
              type: 'review_received',
              title: 'New review received',
              message: `Buyer left a review on Order #${orderShort}`,
              data: { order_id: order.id, product_id: productId }
            })
          })
        } catch (notifyErr) {
          console.warn('Failed to send review notification', notifyErr)
        }
      }
      pushToast('success', 'Thanks for reviewing your order!')
    } catch (err) {
      console.warn('Review submit failed', err)
      pushToast('error', 'Could not submit review right now.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleSend = async () => {
    if (!order) return
    const text = compose.trim()
    if (!text && !(attachments && attachments.length)) return
    try {
      setPosting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      let attachmentUrls: string[] = []
      if (attachments && attachments.length) {
        setUploading(true)
        try {
          const files = Array.from(attachments)
          const uploaded: string[] = []
          for (const f of files) {
            const stamp = Date.now().toString(36)
            const path = `${order.id}/messages/${stamp}-${encodeURIComponent(f.name)}`
            const { error: upErr } = await supabase.storage.from('order-deliveries').upload(path, f, { upsert: true })
            if (upErr) throw upErr
            const { data: pub } = supabase.storage.from('order-deliveries').getPublicUrl(path)
            uploaded.push(pub.publicUrl)
          }
          attachmentUrls = uploaded
        } finally {
          setUploading(false)
        }
      }

      const ok = await sendOrderMessage({ order_id: order.id, sender_id: user.id, message: text || '(attachment)', attachments: attachmentUrls })
      if (ok) {
        setCompose('')
        setAttachments(null)
        const msgs = await getOrderMessages(order.id)
        setMessages(msgs)
        // Notify the other party about the new message
        try {
          const otherPartyId = user.id === order.buyer?.id ? order.seller?.id : order.buyer?.id
          if (otherPartyId) {
            await fetch('/api/notifications/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: otherPartyId,
                type: 'order_message',
                title: `New message on Order #${orderShort}`,
                message: text ? (text.length > 120 ? text.slice(0, 117) + '…' : text) : 'Sent an attachment',
                data: { order_id: order.id }
              })
            })
          }
        } catch (e) {
          console.warn('Failed to create message notification', e)
        }
      }
    } finally {
      setPosting(false)
    }
  }

  const approveDelivery = async () => {
    if (!order) return
    const ok = await updateOrderStatus(order.id, 'completed')
    if (ok) {
      setOrder((o:any)=>({ ...o, status: 'completed' }))
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await sendOrderMessage({ order_id: order.id, sender_id: user.id, message: 'Order approved by buyer', is_system_message: true })
        // Notify seller
        if (order.seller?.id) {
          try { await fetch('/api/notifications/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: order.seller.id, type: 'order_approved', title: 'Delivery approved', message: `Order #${orderShort} was approved`, data: { order_id: order.id } }) }) } catch {}
        }
      }
      pushToast('success', 'Delivery approved. Thank you!', 'Order completed')
    }
  }

  const requestRevision = async () => {
    if (!order) return
    const ok = await updateOrderStatus(order.id, 'revision_requested')
    if (ok) {
      setOrder((o:any)=>({ ...o, status: 'revision_requested' }))
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await sendOrderMessage({ order_id: order.id, sender_id: user.id, message: 'Buyer requested a revision', is_system_message: true })
        // Notify seller
        if (order.seller?.id) {
          try { await fetch('/api/notifications/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: order.seller.id, type: 'revision_requested', title: 'Revision requested', message: `Order #${orderShort}: buyer requested changes`, data: { order_id: order.id } }) }) } catch {}
        }
      }
      pushToast('info', 'Revision requested. The seller will follow up.', 'Request sent')
    }
  }
  const handleSendDelivery = async () => {
    if (!order) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    if (!deliveryFiles || deliveryFiles.length === 0) return
    try {
      setUploading(true)
      const files = Array.from(deliveryFiles).map(f => ({ name: f.name, blob: f as any }))
      const ok = await createDeliverable({ order_id: order.id, uploaded_by: user.id, description: deliveryNote || undefined, files })
      if (ok) {
        await updateOrderStatus(order.id, 'delivered')
        setOrder((o:any)=>({ ...o, status: 'delivered' }))
        const dels = await listDeliverables(order.id)
        setDeliveries(dels)
        // System message for delivery posted
        await sendOrderMessage({ order_id: order.id, sender_id: user.id, message: 'Seller posted a delivery', is_system_message: true })
        // Notify buyer
        if (order.buyer?.id) {
          try {
            await fetch('/api/notifications/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: order.buyer.id, type: 'delivery_posted', title: 'New delivery received', message: `Order #${orderShort}: seller posted a delivery`, data: { order_id: order.id } }) })
          } catch {}
        }
        setShowDeliverModal(false)
        setDeliveryFiles(null)
        setDeliveryNote('')
      }
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order…</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">
        <div className="flex items-center gap-2"><AlertCircle className="w-5 h-5"/> Order not found</div>
      </div>
    )
  }

  const isLiveCallEnabled = order?.product?.features?.some((f: string) => f.toLowerCase().includes('live call'))

  const handleJoinCall = async (type: 'video' | 'audio') => {
    setCallType(type)
    setInCall(true)
    if (!order || !currentUser) return

    // Send system message
    try {
      await sendOrderMessage({
        order_id: order.id,
        sender_id: currentUser.id,
        message: `Started a live ${type} call`,
        is_system_message: true
      })
    } catch (e) {
      console.warn('Failed to send call system message', e)
    }

    // Notify other party
    const otherPartyId = currentUser.id === order.buyer?.id ? order.seller?.id : order.buyer?.id
    if (otherPartyId) {
      try {
        await fetch('/api/notifications/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: otherPartyId,
            type: 'call_started',
            title: `Live ${type === 'video' ? 'Video' : 'Audio'} Call Started`,
            message: `Join the live call for Order #${orderShort}`,
            data: { order_id: order.id }
          })
        })
      } catch (e) {
        console.warn('Failed to send call notification', e)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ToastContainer toasts={toasts} onClose={(id: string)=>setToasts(p=>p.filter(t=>t.id!==id))} />
      
      {inCall && order && currentUser && (
        <WebRTCVideoCall 
          orderId={order.id}
          currentUser={currentUser}
          remoteUserName={
            currentUser.id === order.buyer?.id 
              ? (order.seller?.full_name || order.seller?.username || 'Seller')
              : (order.buyer?.full_name || order.buyer?.username || 'Buyer')
          }
          onLeave={() => setInCall(false)}
          audioOnly={callType === 'audio'}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="mb-6 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>

        {isSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Order Confirmed!</h3>
                <p className="text-green-700 dark:text-green-400">Your payment has been processed successfully.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card with tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order #{orderShort}</h1>
                <div className="flex items-center gap-3">
                  {isLiveCallEnabled && (
                    <>
                      <button 
                        onClick={() => handleJoinCall('video')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${callActive ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      >
                        <Video className="w-4 h-4" />
                        {callActive ? 'Join Video' : 'Video Call'}
                      </button>
                      <button 
                        onClick={() => handleJoinCall('audio')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm ${callActive ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                      >
                        <Phone className="w-4 h-4" />
                        {callActive ? 'Join Audio' : 'Audio Call'}
                      </button>
                    </>
                  )}
                  <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 capitalize">{(order.status||'confirmed').replace('_',' ')}</div>
                </div>
              </div>

              <div className="mt-5 flex gap-2 border-b dark:border-gray-700">
                {(['activity','details','requirements','delivery'] as TabKey[]).map(t => (
                  <button key={t} onClick={()=>setActiveTab(t)} className={`px-3 py-2 text-sm font-medium -mb-px border-b-2 ${activeTab===t ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>{t[0].toUpperCase()+t.slice(1)}</button>
                ))}
              </div>

              {/* Tab content */}
              <div className="mt-6">
                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    {/* Timeline (basic) */}
                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400"/> Order placed</div>
                      {order.requirements ? <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400"/> Requirements submitted</div> : null}
                      {order.status==='in_progress' && <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600 dark:text-blue-400"/> Order in progress</div>}
                      {order.status==='delivered' && <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400"/> Delivered</div>}
                      {order.status==='completed' && <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400"/> Completed</div>}
                    </div>
                    
                    <div className="border-t dark:border-gray-700 my-4"></div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Order Discussion</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Use this chat to discuss requirements, share files, and communicate updates.</p>

                    {/* Messages */}
                    <div className="space-y-3">
                      {messages.map((m:any)=> {
                        const isSys = !!m.is_system_message
                        // System message styling
                        let accent = 'bg-blue-600'
                        let bg = 'bg-blue-50 dark:bg-blue-900/20'
                        let border = 'border-blue-100 dark:border-blue-800'
                        let Icon:any = Megaphone
                        if (typeof m.message === 'string') {
                          const text = m.message.toLowerCase()
                          if (text.includes('approved')) { accent='bg-green-600'; bg='bg-green-50 dark:bg-green-900/20'; border='border-green-100 dark:border-green-800'; Icon=BadgeCheck }
                          else if (text.includes('revision')) { accent='bg-amber-600'; bg='bg-amber-50 dark:bg-amber-900/20'; border='border-amber-100 dark:border-amber-800'; Icon=RefreshCcw }
                          else if (text.includes('delivery')) { accent='bg-indigo-600'; bg='bg-indigo-50 dark:bg-indigo-900/20'; border='border-indigo-100 dark:border-indigo-800'; Icon=PackageOpen }
                        }
                        if (isSys) {
                          return (
                            <div key={m.id} className={`p-3 rounded-lg border ${bg} ${border}`}>
                              <div className="flex items-start gap-3">
                                <div className={`w-1 self-stretch rounded ${accent}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(m.created_at).toLocaleString()}</div>
                                    <div className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 dark:text-gray-300">
                                      <Icon className="w-3.5 h-3.5"/> System
                                    </div>
                                  </div>
                                  <div className="text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">{m.message}</div>
                                  {Array.isArray(m.attachments) && m.attachments.length>0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {m.attachments.map((a:string, i:number)=> (
                                        <a key={i} href={a} target="_blank" className="text-xs text-blue-600 dark:text-blue-400 underline flex items-center gap-1"><Paperclip className="w-3 h-3"/> Attachment {i+1}</a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        }
                        // Regular user messages with sender identification
                        const mine = !!(currentUser && m.sender_id === currentUser.id)
                        const buyerId = order?.buyer?.id
                        const senderIsBuyer = m.sender_id === buyerId
                        const sender = senderIsBuyer ? order?.buyer : order?.seller
                        const name = mine ? 'You' : (sender?.full_name || sender?.username || (senderIsBuyer ? 'Buyer' : 'Seller'))
                        const role = senderIsBuyer ? 'Buyer' : 'Seller'
                        const avatar = sender?.avatar_url
                        return (
                          <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] flex items-start gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                              {/* Avatar */}
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] text-gray-600 dark:text-gray-300">
                                {avatar ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                  (name||'')[0]?.toUpperCase() || '?'
                                )}
                              </div>
                              {/* Bubble */}
                              <div className={`p-3 rounded-xl border ${mine ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-700'}`}>
                                <div className={`text-[11px] mb-1 ${mine ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                  <span className="font-medium">{name}</span>
                                  <span className="mx-1">•</span>
                                  <span>{role}</span>
                                  <span className="mx-1">•</span>
                                  <span className="text-gray-500 dark:text-gray-400">{new Date(m.created_at).toLocaleString()}</span>
                                </div>
                                <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{m.message}</div>
                                {Array.isArray(m.attachments) && m.attachments.length>0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {m.attachments.map((a:string, i:number)=> (
                                      <a key={i} href={a} target="_blank" className="text-xs text-blue-600 dark:text-blue-400 underline flex items-center gap-1"><Paperclip className="w-3 h-3"/> Attachment {i+1}</a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* Composer */}
                    <div className="flex gap-2 mt-3 items-center">
                      <label className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
                        <Paperclip className="w-4 h-4"/>
                        <input type="file" multiple className="hidden" onChange={e=>setAttachments(e.target.files)} />
                        Attach
                      </label>
                      <input value={compose} onChange={e=>setCompose(e.target.value)} className="flex-1 border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" placeholder="Write a message..." />
                      <button onClick={handleSend} disabled={posting || uploading || (!compose.trim() && !(attachments && attachments.length))} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-1">
                        <Send className="w-4 h-4"/>
                        {posting || uploading ? 'Sending…' : 'Send'}
                      </button>
                    </div>
                    {attachments && attachments.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{attachments.length} file(s) attached</div>
                    )}
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-lg">{order.product?.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">by {order.seller?.full_name || order.seller?.username}</div>
                      </div>
                      <div className="inline-flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{order.package?.name || 'Standard'} package</span>
                        {order.package?.delivery_time ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">{order.package.delivery_time} days</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50/80 dark:bg-gray-800/80">
                          <tr className="text-left text-gray-600 dark:text-gray-400">
                            <th className="p-3">Item</th>
                            <th className="p-3">Qty.</th>
                            <th className="p-3">Duration</th>
                            <th className="p-3">Price</th>
                          </tr>
                        </thead>
                        <tbody className="dark:text-gray-300">
                          <tr className="border-t dark:border-gray-700">
                            <td className="p-4 align-top">
                              <div className="font-medium text-gray-900 dark:text-white">{order.package?.name || 'Standard'}</div>
                              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                                {(order.package?.features||[]).map((f:string,i:number)=> <li key={i}>{f}</li>)}
                              </ul>
                            </td>
                            <td className="p-4">{order.quantity ?? 1}</td>
                            <td className="p-4">{order.package?.delivery_time ? `${order.package.delivery_time} days` : '—'}</td>
                            <td className="p-4">${(order.package?.price ?? order.unit_price ?? 0).toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {(() => {
                      const unit = order?.package?.price ?? order?.unit_price ?? 0
                      const qty = order?.quantity ?? 1
                      const subtotal = unit * qty
                      const fee = typeof order?.service_fee === 'number' ? order.service_fee : Math.round(subtotal * 0.05 * 100) / 100
                      const total = typeof order?.total_price === 'number' ? order.total_price : subtotal + fee
                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Subtotal</span><span className="font-medium text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Service Fee</span><span className="font-medium text-gray-900 dark:text-white">${fee.toFixed(2)}</span></div>
                          <div className="flex justify-between text-base font-semibold pt-2 border-t dark:border-gray-700 text-gray-900 dark:text-white"><span>Total</span><span>${total.toFixed(2)}</span></div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {activeTab === 'requirements' && (
                  <div className="space-y-4">
                    {!order.requirements ? (
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 text-sm">No requirements submitted yet.</div>
                        {isBuyer && (
                          <RequirementsForm order={order} reqForm={reqForm} setReqForm={setReqForm}
                            onSubmitted={(next)=> {
                              setOrder((o:any)=> ({...o, requirements: next, status: 'in_progress'}))
                              pushToast('success', 'Requirements submitted. Work can begin.', 'Submitted')
                            }}
                            notify={(t:ToastItem['type'], m:string, title?:string)=> pushToast(t,m,title)}
                          />
                        )}
                        {!isBuyer && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">Waiting for buyer to submit requirements.</div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        {Object.entries(order.requirements).map(([k,v]:any)=> (
                          <div key={k} className="p-3 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                            <div className="text-gray-500 dark:text-gray-400 text-xs uppercase">{k}</div>
                            <div className="text-gray-900 dark:text-white whitespace-pre-wrap">{String(v)}</div>
                          </div>
                        ))}
                        {isSeller && (
                          <RequestInfoCard orderId={order.id} onRequested={() => setActiveTab('activity')} />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'delivery' && (
                  <div className="space-y-4">
                    {isBuyer && order.status==='delivered' && (
                      <div className={`p-4 rounded-lg border ${overdue ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300'}`}>
                        {overdue ? 'Approval window ended. Please review the delivery.' : `Please review the delivery by ${approveByLabel || 'the deadline'}.`}
                      </div>
                    )}
                    {deliveries.length===0 && <div className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-sm">No deliveries yet.</div>}
                    {deliveries.map((d:any, idx:number)=> (
                      <div key={d.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Delivery #{idx+1} • {new Date(d.created_at).toLocaleString()}</div>
                        {d.description && <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{d.description}</div>}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <a href={d.file_url} target="_blank" className="text-xs text-blue-600 dark:text-blue-400 underline flex items-center gap-1"><Paperclip className="w-3 h-3"/> {d.file_name}</a>
                        </div>
                      </div>
                    ))}
                    {isBuyer && order.status==='delivered' && (
                      <div className="flex flex-wrap gap-2">
                        <button onClick={approveDelivery} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">Yes, I approve delivery</button>
                        <button onClick={requestRevision} className="px-4 py-2 border dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Request revision</button>
                      </div>
                    )}
                    {isSeller && (order.status==='in_progress' || order.status==='revision_requested' || order.status==='confirmed') ? (
                      <div>
                        <button onClick={()=>setShowDeliverModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1"><Upload className="w-4 h-4"/> Send delivery</button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h3>
              {(() => {
                const unit = order?.package?.price ?? order?.unit_price ?? 0
                const qty = order?.quantity ?? 1
                const subtotal = unit * qty
                const fee = typeof order?.service_fee === 'number' ? order.service_fee : Math.round(subtotal * 0.05 * 100) / 100
                const total = typeof order?.total_price === 'number' ? order.total_price : subtotal + fee
                return (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Package Price</span><span className="font-medium text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Service Fee (5%)</span><span className="font-medium text-gray-900 dark:text-white">${fee.toFixed(2)}</span></div>
                    <div className="border-t dark:border-gray-700 pt-3 flex justify-between font-semibold text-lg text-gray-900 dark:text-white"><span>Total</span><span>${total.toFixed(2)}</span></div>
                  </div>
                )
              })()}
              <button onClick={()=>setShowBilling(v=>!v)} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                <Info className="w-4 h-4"/> {showBilling ? 'Hide' : 'View'} billing details
              </button>
              {showBilling && (()=>{
                const unit = order?.package?.price ?? order?.unit_price ?? 0
                const qty = order?.quantity ?? 1
                const subtotal = unit * qty
                const fee = typeof order?.service_fee === 'number' ? order.service_fee : Math.round(subtotal * 0.05 * 100) / 100
                const total = typeof order?.total_price === 'number' ? order.total_price : subtotal + fee
                return (
                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Order placed: {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}</div>
                    <div>Payment method: {order.payment_method || '—'}</div>
                    <div>Transaction ID: {order.transaction_id || '—'}</div>
                    <div>Subtotal: ${subtotal.toFixed(2)} • Fee: ${fee.toFixed(2)} • Total: ${total.toFixed(2)}</div>
                  </div>
                )
              })()}
            </div>
            {/* Order meta */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order details</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                  {order.product?.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={order.product.images[0]} alt="thumb" className="w-full h-full object-cover"/>
                  ) : (
                    <span className="text-xs text-gray-400">No image</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{order.product?.title || 'Product'}</div>
                  <div className="text-xs text-gray-600 truncate">Seller: {order.seller?.full_name || order.seller?.username || '—'}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600 flex items-center justify-between">
                <div>Order #: <span className="font-mono">{order.order_number || orderShort}</span></div>
                <button onClick={async ()=>{ try{ await navigator.clipboard.writeText(order.order_number || order.id); pushToast('success','Order number copied'); }catch{ pushToast('error','Copy failed'); } }} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                  <Copy className="w-3 h-3"/> Copy
                </button>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Track Order</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400"/> Order placed</li>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">{order.requirements ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400"/> : <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500"/>} Requirements submitted</li>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">{order.status==='in_progress' || order.status==='delivered' || order.status==='completed' ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400"/> : <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500"/>} Order in progress</li>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">{order.status==='delivered' || order.status==='completed' ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400"/> : <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500"/>} Review delivery</li>
                <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">{order.status==='completed' ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400"/> : <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500"/>} Complete order</li>
              </ol>
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Expected delivery: {expectedDate || (order.package?.delivery_time ? `within ${order.package.delivery_time} days` : '—')}</div>
              {order.status==='delivered' && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Approve by: {approveByLabel || '—'}</div>
              )}
            </div>
            {isBuyer && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Leave a review</h3>
                {hasSubmittedReview ? (
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-700 dark:text-green-300 text-sm">Thank you! Your review has been submitted.</div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Product rating</div>
                      <div className="font-medium text-gray-900 dark:text-white">{existingReview?.rating ?? reviewForm.rating}/5</div>
                      {existingReview?.comment && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{existingReview.comment}</p>}
                    </div>
                    {existingReview?.seller_rating ? (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Seller experience</div>
                        <div className="font-medium text-gray-900 dark:text-white">{existingReview.seller_rating}/5</div>
                        {existingReview.seller_comment && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{existingReview.seller_comment}</p>}
                      </div>
                    ) : null}
                  </div>
                ) : canReview ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Product rating *</label>
                      <select
                        value={reviewForm.rating}
                        onChange={e => setReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                        className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        {[5,4,3,2,1].map(val => (
                          <option key={val} value={val}>{val} Stars</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Product feedback</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        rows={3}
                        maxLength={500}
                        placeholder="Share your experience for future buyers"
                        className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 text-right">{reviewForm.comment.length}/500</div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Seller rating (optional)</label>
                      <select
                        value={reviewForm.sellerRating}
                        onChange={e => setReviewForm(prev => ({ ...prev, sellerRating: Number(e.target.value) }))}
                        className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        {[0,5,4,3,2,1].map(val => (
                          <option key={val} value={val}>{val === 0 ? 'Skip' : `${val} Stars`}</option>
                        ))}
                      </select>
                    </div>
                    {reviewForm.sellerRating > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-1">Seller feedback</label>
                        <textarea
                          value={reviewForm.sellerComment}
                          onChange={e => setReviewForm(prev => ({ ...prev, sellerComment: e.target.value }))}
                          rows={3}
                          maxLength={400}
                          placeholder="Let the seller know what stood out."
                          className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 text-right">{reviewForm.sellerComment.length}/400</div>
                      </div>
                    )}
                    <button
                      onClick={handleSubmitReview}
                      disabled={submittingReview}
                      className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting…' : 'Submit review'}
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Reviews unlock once the order is delivered. We'll remind you again after completion.
                  </div>
                )}
              </div>
            )}
            <div className="space-y-3">
              <Link href="/" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block">Continue Shopping</Link>
              <Link href="/orders" className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-lg border dark:border-gray-700 transition-colors text-center block">View All Orders</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Send Delivery Modal */}
      {showDeliverModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white"><PackageOpen className="w-5 h-5"/><h3 className="font-semibold">Send Delivery</h3></div>
              <button onClick={()=>setShowDeliverModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
            </div>
            <div className="space-y-3">
              <textarea value={deliveryNote} onChange={e=>setDeliveryNote(e.target.value)} className="w-full border dark:border-gray-700 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400" rows={4} placeholder="Add a note about this delivery (optional)" />
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white">
                <Upload className="w-4 h-4"/>
                <input type="file" multiple className="hidden" onChange={e=>setDeliveryFiles(e.target.files)} />
                Attach files
              </label>
              {deliveryFiles && deliveryFiles.length>0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">{deliveryFiles.length} file(s) selected</div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setShowDeliverModal(false)} className="px-3 py-2 border dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={handleSendDelivery} disabled={uploading || !(deliveryFiles && deliveryFiles.length)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50">Send delivery</button>
            </div>
          </div>
        </div>
      )}
      {/* Toasts */}
      <ToastContainer toasts={toasts} onClose={(id)=> setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  )
}

function RequirementsForm({ order, reqForm, setReqForm, onSubmitted, notify }:{ order:any; reqForm:any; setReqForm: (v:any)=>void; onSubmitted:(r:any)=>void; notify: (type:ToastItem['type'], msg:string, title?:string)=>void }){
  const [saving, setSaving] = useState(false)
  const onSubmit = async () => {
    const payload = {
      details: reqForm.details?.trim() || undefined,
      urls: reqForm.urls?.trim() || undefined,
      notes: reqForm.notes?.trim() || undefined,
    }
    try {
      setSaving(true)
      const ok = await updateOrderRequirements(order.id, payload, true)
      if (ok) {
        // System message on requirements submission
        const { data: { user } } = await supabase.auth.getUser()
        if (user) await sendOrderMessage({ order_id: order.id, sender_id: user.id, message: 'Buyer submitted requirements', is_system_message: true })
        // Notify seller (server-side)
        try {
          if (order.seller?.id) {
            await fetch('/api/notifications/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: order.seller.id, type: 'requirements_submitted', title: 'Requirements submitted', message: `Order #${(order.id||'').substring(0,8)}: buyer submitted requirements`, data: { order_id: order.id } }) })
          }
        } catch {}
        onSubmitted(payload)
        notify('success','Requirements submitted successfully')
      }
    } finally { setSaving(false) }
  }
  return (
    <div className="border rounded-lg p-4">
      <div className="font-medium mb-2">Submit Requirements</div>
      <div className="space-y-3 text-sm">
        <div>
          <div className="text-gray-600 mb-1">Project details</div>
          <textarea className="w-full border rounded-lg p-2" rows={3} value={reqForm.details} onChange={e=>setReqForm({...reqForm, details: e.target.value})} placeholder="Describe your project and goals" />
        </div>
        <div>
          <div className="text-gray-600 mb-1">URLs (comma-separated)</div>
          <input className="w-full border rounded-lg p-2" value={reqForm.urls} onChange={e=>setReqForm({...reqForm, urls: e.target.value})} placeholder="https://example.com, https://brief.link" />
        </div>
        <div>
          <div className="text-gray-600 mb-1">Notes to seller</div>
          <textarea className="w-full border rounded-lg p-2" rows={2} value={reqForm.notes} onChange={e=>setReqForm({...reqForm, notes: e.target.value})} placeholder="Any additional context" />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button onClick={onSubmit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">{saving?'Submitting…':'Submit requirements'}</button>
      </div>
    </div>
  )
}

function RequestInfoCard({ orderId, onRequested }:{ orderId:string; onRequested:()=>void }){
  const [sending, setSending] = useState(false)
  const askMore = async () => {
    try {
      setSending(true)
      // Instead of changing status (guarded for buyer), send a system message and notify buyer
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await sendOrderMessage({ order_id: orderId, sender_id: user.id, message: 'Seller requested additional information from buyer', is_system_message: true })
      }
      // Try to find order participants to notify buyer
      try {
        const ord = await getOrderById(orderId)
        if (ord?.buyer?.id) {
          await createNotification({ user_id: ord.buyer.id, type: 'requirements_submitted', title: 'More info requested', message: `Seller requested more information for your order #${(orderId||'').substring(0,8)}`, data: { order_id: orderId } })
        }
      } catch {}
      onRequested()
    } finally { setSending(false) }
  }
  return (
    <div className="mt-3 p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
      <div className="text-sm text-gray-700">Need additional information?</div>
      <button onClick={askMore} disabled={sending} className="px-3 py-2 border rounded-lg text-sm">{sending?'Requesting…':'Request more info'}</button>
    </div>
  )
}
