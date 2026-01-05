'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Shield,
  Ban,
  Eye,
  Mail,
  Calendar,
  Users as UsersIcon,
  Store,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

type User = {
  id: string
  username: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  bio: string | null
  is_creator: boolean
  is_verified: boolean
  is_banned: boolean
  ban_reason: string | null
  subscription_tier: string
  total_earnings: number
  total_sales: number
  rating: number
  created_at: string
}

const ITEMS_PER_PAGE = 20

export default function UsersPage() {
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [filter, page, searchQuery])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filter === 'sellers') {
        query = query.eq('is_creator', true)
      } else if (filter === 'verified') {
        query = query.eq('is_verified', true)
      } else if (filter === 'banned') {
        query = query.eq('is_banned', true)
      }

      // Apply search
      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      }

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      setUsers(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyUser = async (userId: string, verify: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_verified: verify })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      console.error('Failed to update user:', error)
    }
    setActionMenuId(null)
  }

  const handleBanUser = async (userId: string, ban: boolean, reason?: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_banned: ban,
          ban_reason: ban ? reason : null,
          banned_at: ban ? new Date().toISOString() : null
        })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      console.error('Failed to ban user:', error)
    }
    setActionMenuId(null)
  }

  const handleMakeSeller = async (userId: string, isSeller: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_creator: isSeller })
        .eq('id', userId)

      if (error) throw error
      fetchUsers()
    } catch (error) {
      console.error('Failed to update user:', error)
    }
    setActionMenuId(null)
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const filters = [
    { key: 'all', label: 'All Users', count: null },
    { key: 'sellers', label: 'Sellers', count: null },
    { key: 'verified', label: 'Verified', count: null },
    { key: 'banned', label: 'Banned', count: null },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage all users on your platform</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                          {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              {user.full_name?.[0] || user.username?.[0] || '?'}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            {user.full_name || user.username}
                            {user.is_verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <Ban className="w-3 h-3" /> Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {user.is_creator ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            <Store className="w-3 h-3" /> Seller
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Buyer
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {user.subscription_tier}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_creator ? (
                        <div className="text-sm">
                          <div className="text-gray-900 dark:text-white">${user.total_earnings?.toFixed(2) || '0.00'}</div>
                          <div className="text-gray-500 dark:text-gray-400">{user.total_sales || 0} sales</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>

                        {actionMenuId === user.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setActionMenuId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                              <Link
                                href={`/creator/${user.username}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Eye className="w-4 h-4" /> View Profile
                              </Link>
                              <button
                                onClick={() => handleVerifyUser(user.id, !user.is_verified)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {user.is_verified ? (
                                  <>
                                    <XCircle className="w-4 h-4" /> Remove Verification
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" /> Verify User
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleMakeSeller(user.id, !user.is_creator)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {user.is_creator ? (
                                  <>
                                    <UsersIcon className="w-4 h-4" /> Remove Seller Status
                                  </>
                                ) : (
                                  <>
                                    <Store className="w-4 h-4" /> Make Seller
                                  </>
                                )}
                              </button>
                              <hr className="my-1 border-gray-200 dark:border-gray-700" />
                              <button
                                onClick={() => handleBanUser(user.id, !user.is_banned, user.is_banned ? undefined : 'Violation of terms')}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${
                                  user.is_banned 
                                    ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                                    : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                }`}
                              >
                                {user.is_banned ? (
                                  <>
                                    <CheckCircle className="w-4 h-4" /> Unban User
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-4 h-4" /> Ban User
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
