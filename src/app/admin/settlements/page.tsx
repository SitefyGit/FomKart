'use client'

import { useState, useEffect } from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'
import { supabase } from '@/lib/supabase'
import { CheckCircle, Clock, XCircle, MoreVertical, CreditCard } from 'lucide-react'

interface Settlement {
  id: string
  seller_id: string
  amount: number
  currency: string
  status: string
  payout_method: string
  payout_details: any
  processed_at: string | null
  created_at: string
  users?: {
    username: string
    full_name: string
    email: string
  }
}

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { formatPrice } = useCurrency()

  useEffect(() => {
    fetchSettlements()
  }, [filter])

  const fetchSettlements = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/admin/settlements?status=${filter}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      if (!res.ok) throw new Error('Failed to fetch settlements')
      const data = await res.json()
      setSettlements(data.settlements || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this payout as ${newStatus}?`)) return

    setProcessingId(id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/settlements', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ id, status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update status')
      
      // Refresh the list
      fetchSettlements()
    } catch (err) {
      console.error(err)
      alert('Failed to update settlement status.')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="flex w-fit items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"><CheckCircle className="w-3.5 h-3.5" /> Completed</span>
      case 'pending':
        return <span className="flex w-fit items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200"><Clock className="w-3.5 h-3.5" /> Pending</span>
      case 'processing':
        return <span className="flex w-fit items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200"><Clock className="w-3.5 h-3.5" /> Processing</span>
      case 'failed':
        return <span className="flex w-fit items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200"><XCircle className="w-3.5 h-3.5" /> Failed</span>
      default:
        return <span className="text-xs text-gray-500 capitalize">{status}</span>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-emerald-600" />
          Settlements & Payouts
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage seller withdrawal requests and platform payouts.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {['pending', 'processing', 'completed', 'failed', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              filter === tab
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method & Details</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div></div>
                </td>
              </tr>
            ) : settlements.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  No settlements found.
                </td>
              </tr>
            ) : (
              settlements.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{s.users?.full_name || s.users?.username}</div>
                    <div className="text-sm text-gray-500">{s.users?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(s.amount)}</div>
                    <div className="text-xs text-gray-500">{s.currency}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white capitalize">{s.payout_method.replace('_', ' ')}</div>
                    <div className="text-sm text-gray-500 max-w-[200px] truncate" title={s.payout_details?.account}>
                      {s.payout_details?.account || JSON.stringify(s.payout_details)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(s.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {processingId === s.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                      ) : (
                        <>
                          {s.status === 'pending' && (
                            <button onClick={() => updateStatus(s.id, 'processing')} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md transition-colors">Process</button>
                          )}
                          {(s.status === 'pending' || s.status === 'processing') && (
                            <button onClick={() => updateStatus(s.id, 'completed')} className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 px-3 py-1 rounded-md transition-colors">Complete</button>
                          )}
                          {(s.status === 'pending' || s.status === 'processing') && (
                            <button onClick={() => updateStatus(s.id, 'failed')} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md transition-colors">Fail</button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
