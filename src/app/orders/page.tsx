'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Clock, Package, ArrowRight, AlertCircle, Loader2, Truck, Ban, RefreshCw } from 'lucide-react'
import { supabase, getUserOrders } from '@/lib/supabase'

type TabKey = 'buying' | 'selling'

function OrdersDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabKey>('buying')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<any[]>([])
  const [selling, setSelling] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])

  useEffect(() => {
    // Initialize tab from URL if present
    const tab = (searchParams?.get('tab') || '').toLowerCase()
    if (tab === 'selling' || tab === 'buying') setActiveTab(tab as TabKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUserId(user.id)

        // Load both lists in parallel
        const [asBuyer, asSeller] = await Promise.all([
          getUserOrders(user.id, 'buyer'),
          getUserOrders(user.id, 'seller')
        ])
        setBuying(asBuyer)
        setSelling(asSeller)
      } catch (e: any) {
        console.warn('Orders load failed', e)
        setError('Failed to load your orders. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  // Keep URL in sync with selected tab for deep-linking
  useEffect(() => {
    const current = searchParams?.get('tab') || 'buying'
    if (current !== activeTab) {
      const qs = new URLSearchParams(searchParams?.toString() || '')
      qs.set('tab', activeTab)
      router.replace(`/orders?${qs.toString()}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const orders = activeTab === 'buying' ? buying : selling
  const normalizedSearch = search.trim().toLowerCase()
  const matchesSearch = (o: any) => {
    if (!normalizedSearch) return true
    const productTitle = o.product?.title || ''
    const pkgName = o.package?.name || ''
    const orderNum = o.order_number || ''
    return [productTitle, pkgName, orderNum].some((s) => (s || '').toLowerCase().includes(normalizedSearch))
  }
  const matchesStatus = (o: any) => {
    if (!statusFilter.length) return true
    return statusFilter.includes(o.status)
  }
  const filtered = (orders || []).filter((o) => matchesSearch(o) && matchesStatus(o))

  // Build status chips dynamically from present orders
  const allStatuses: Array<{ key: string; label: string; className: string; icon: React.ReactNode }> = [
    { key: 'pending', label: 'Pending', className: 'bg-gray-100 text-gray-700', icon: <Clock className="w-3 h-3"/> },
    { key: 'confirmed', label: 'Confirmed', className: 'bg-blue-100 text-blue-700', icon: <CheckCircle className="w-3 h-3"/> },
    { key: 'in_progress', label: 'In progress', className: 'bg-amber-100 text-amber-700', icon: <Loader2 className="w-3 h-3"/> },
    { key: 'revision_requested', label: 'Revision', className: 'bg-orange-100 text-orange-700', icon: <RefreshCw className="w-3 h-3"/> },
    { key: 'delivered', label: 'Delivered', className: 'bg-purple-100 text-purple-700', icon: <Truck className="w-3 h-3"/> },
    { key: 'completed', label: 'Completed', className: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3"/> },
    { key: 'cancelled', label: 'Cancelled', className: 'bg-slate-100 text-slate-700', icon: <Ban className="w-3 h-3"/> },
    { key: 'refunded', label: 'Refunded', className: 'bg-red-100 text-red-700', icon: <Ban className="w-3 h-3"/> },
  ]
  const statusCounts: Record<string, number> = orders.reduce((acc: Record<string, number>, o: any) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})
  const toggleStatus = (key: string) => {
    setStatusFilter((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }
  const clearFilters = () => { setSearch(''); setStatusFilter([]) }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your orders…</p>
        </div>
      </div>
    )
  }

  if (!userId) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Orders</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track progress, view details, and manage your purchases and sales.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('buying')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${activeTab==='buying' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
          >
            Buying
          </button>
          <button
            onClick={() => setActiveTab('selling')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${activeTab==='selling' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
          >
            Selling
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        {/* Filters row */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product, package, or order #"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
            {(search || statusFilter.length) ? (
              <button onClick={clearFilters} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">Clear filters</button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setStatusFilter([])}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${statusFilter.length ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600' : 'bg-gray-900 dark:bg-gray-700 text-white border-gray-900 dark:border-gray-700 shadow-sm'}`}
            >
              All ({orders.length})
            </button>
            {allStatuses.filter(s => statusCounts[s.key]).map((s) => (
              <button
                key={s.key}
                onClick={() => toggleStatus(s.key)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors ${statusFilter.includes(s.key) ? s.className + ' border-transparent shadow-sm' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600'}`}
                title={`${s.label}`}
              >
                {s.icon} {s.label} ({statusCounts[s.key] || 0})
              </button>
            ))}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-600 dark:text-gray-400">
            {activeTab==='buying' ? 'No purchases yet.' : 'No sales yet.'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-600 dark:text-gray-400">
            No orders match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((o) => {
              const productTitle = o.product?.title || 'Product'
              const status = o.status || 'confirmed'
              const pkgName = o.package?.name || 'Standard'
              const price = o.total_price ?? (o.unit_price ?? 0) * (o.quantity ?? 1)
              const delivery = o.expected_delivery || null
              const statusMeta = allStatuses.find(s => s.key === status) || allStatuses[1]
              return (
                <Link
                  href={`/orders/${o.id}`}
                  key={o.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition block"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="font-semibold text-gray-900 dark:text-white line-clamp-1">{productTitle}</span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{pkgName}</span>
                        {o.quantity ? <span> • Qty {o.quantity}</span> : null}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${statusMeta.className}`}>
                          {statusMeta.icon} {status.replace('_',' ')}
                        </span>
                        {delivery && (
                          <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Clock className="w-3 h-3" /> {new Date(delivery).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 dark:text-white font-semibold">${Number(price).toFixed(2)}</div>
                      <div className="text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 text-sm mt-1">
                        View details <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrdersDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <OrdersDashboardContent />
    </Suspense>
  )
}
