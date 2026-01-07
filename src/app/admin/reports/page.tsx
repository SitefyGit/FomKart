'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  MessageSquare,
  User,
  Package,
  ExternalLink,
  Filter
} from 'lucide-react'
import Link from 'next/link'

type Report = {
  id: string
  entity_type: 'product' | 'user' | 'review' | 'message'
  entity_id: string
  reason: string
  description: string
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  created_at: string
  reporter: {
    username: string
    full_name: string
  } | null
  resolution?: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [filter])

  const fetchReports = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          reporter:users!reports_reporter_id_fkey(username, full_name)
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (status: 'resolved' | 'dismissed') => {
    if (!selectedReport) return
    setActionLoading(true)

    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status,
          resolution: resolutionNote,
          resolved_at: new Date().toISOString(),
          handled_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', selectedReport.id)

      if (error) throw error

      // If resolved and it's a product/user, we might want to take further action
      // For now, just update the report status
      
      setReports(reports.map(r => r.id === selectedReport.id ? { ...r, status, resolution: resolutionNote } : r))
      setSelectedReport(null)
      setResolutionNote('')
    } catch (error) {
      console.error('Failed to update report:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getEntityLink = (type: string, id: string) => {
    switch (type) {
      case 'product': return `/product/${id}`
      case 'user': return `/creator/${id}` // Assuming user ID maps to username or we have a way to resolve
      default: return '#'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage user reports and moderation</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All Reports</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">All caught up!</h3>
          <p className="text-gray-500 dark:text-gray-400">No reports found with current filter.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                      ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        report.status === 'dismissed' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }
                    `}>
                      {report.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      Reported by {report.reporter?.username || 'Anonymous'} • {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {report.entity_type === 'product' ? <Package className="w-4 h-4" /> :
                     report.entity_type === 'user' ? <User className="w-4 h-4" /> :
                     <MessageSquare className="w-4 h-4" />
                    }
                    Reported {report.entity_type} for {report.reason}
                  </h3>
                  
                  <p className="mt-2 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                    "{report.description}"
                  </p>

                  <div className="mt-4 flex items-center gap-4">
                    <Link 
                      href={getEntityLink(report.entity_type, report.entity_id)}
                      target="_blank"
                      className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      View Content <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {report.status === 'pending' && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                    >
                      Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Review Report</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Resolution Note</label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 h-32"
                placeholder="Explain the action taken..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('dismissed')}
                disabled={actionLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleAction('resolved')}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resolve Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
