'use client'
import React, { useState, useEffect } from 'react'
import { Mail, Users, Download, Filter, Search, Calendar, Tag, Eye } from 'lucide-react'

interface NewsletterSubscriber {
  id: string
  email: string
  name?: string
  preferences?: { interests?: string[] }
  source: string
  status: 'active' | 'unsubscribed' | 'bounced'
  tags: string[]
  created_at: string
  updated_at: string
}

interface NewsletterDashboardProps {
  creatorId: string
  className?: string
}

const PREFERENCE_LABELS: Record<string, string> = {
  'digital-marketing': 'Digital Marketing',
  'product-updates': 'Product Updates',
  'exclusive-offers': 'Exclusive Offers',
  'tutorials': 'Tutorials & Guides',
  'industry-news': 'Industry News',
  'case-studies': 'Case Studies',
}

export function NewsletterDashboard({ creatorId, className = '' }: NewsletterDashboardProps) {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed' | 'bounced'>('active')
  const [sourceFilter, setSourceFilter] = useState<'all' | string>('all')
  const [error, setError] = useState<string | null>(null)

  const fetchSubscribers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!creatorId) {
        setError('Creator ID is required')
        setLoading(false)
        return
      }
      
      const params = new URLSearchParams({
        creatorId: creatorId,
        ...(statusFilter !== 'all' && { status: statusFilter })
      })
      
      const response = await fetch(`/api/newsletter?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400) {
          throw new Error('Invalid creator ID')
        } else if (response.status === 500) {
          throw new Error('Database connection error. Please check your Supabase setup.')
        }
        throw new Error(data.error || 'Failed to fetch subscribers')
      }
      
      setSubscribers(data.subscribers || [])
    } catch (err) {
      console.error('Error fetching subscribers:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load subscribers'
      setError(errorMessage)
      
      // Set empty array as fallback
      setSubscribers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscribers()
  }, [creatorId, statusFilter])

  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = !searchTerm || 
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSource = sourceFilter === 'all' || subscriber.source === sourceFilter
    
    return matchesSearch && matchesSource
  })

  const exportSubscribers = () => {
    const csvContent = [
      ['Email', 'Name', 'Preferences', 'Source', 'Status', 'Subscribed Date'],
      ...filteredSubscribers.map(sub => [
        sub.email,
        sub.name || '',
        sub.preferences?.interests?.join('; ') || '',
        sub.source,
        sub.status,
        new Date(sub.created_at).toLocaleDateString()
      ])
    ]
    
    const csvString = csvContent.map(row => 
      row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvString], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.status === 'active').length,
    thisMonth: subscribers.filter(s => 
      new Date(s.created_at).getMonth() === new Date().getMonth() &&
      new Date(s.created_at).getFullYear() === new Date().getFullYear()
    ).length
  }

  const topSources = Object.entries(
    subscribers.reduce((acc, sub) => {
      acc[sub.source] = (acc[sub.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).sort(([,a], [,b]) => b - a).slice(0, 3)

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-8 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
              <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Newsletter Dashboard</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your subscriber list</p>
            </div>
          </div>
          <button
            onClick={exportSubscribers}
            disabled={filteredSubscribers.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Subscribers</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">{stats.total}</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Active Subscribers</span>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">{stats.active}</p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">This Month</span>
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">{stats.thisMonth}</p>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Top Source</span>
            </div>
            <p className="text-lg font-bold text-amber-900 dark:text-amber-100 mt-1 capitalize">
              {topSources[0]?.[0] || 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
          </select>
          
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Sources</option>
            <option value="lead_capture_form">Lead Form</option>
            <option value="footer_form">Footer Form</option>
            <option value="popup">Popup</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      {/* Subscriber List */}
      <div className="p-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg mb-4">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {filteredSubscribers.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No subscribers found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'active' || sourceFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Start collecting emails with your lead capture forms!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubscribers.map((subscriber) => (
              <div 
                key={subscriber.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {subscriber.name || 'Anonymous'}
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          subscriber.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : subscriber.status === 'unsubscribed'
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {subscriber.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subscriber.email}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Joined {new Date(subscriber.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                          via {subscriber.source.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  {subscriber.preferences?.interests && subscriber.preferences.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {subscriber.preferences.interests.slice(0, 2).map((interest) => (
                        <span 
                          key={interest}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {PREFERENCE_LABELS[interest] || interest}
                        </span>
                      ))}
                      {subscriber.preferences.interests.length > 2 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          +{subscriber.preferences.interests.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            Showing {filteredSubscribers.length} of {subscribers.length} subscribers
          </span>
          <button
            onClick={fetchSubscribers}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}

export default NewsletterDashboard
