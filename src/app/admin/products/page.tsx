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
  Eye,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  Star,
  ExternalLink
} from 'lucide-react'

type Product = {
  id: string
  title: string
  slug: string
  description: string | null
  type: string
  base_price: number
  images: string[]
  status: string
  moderation_status: string
  moderation_notes: string | null
  is_featured: boolean
  views: number
  orders_count: number
  rating: number
  reviews_count: number
  created_at: string
  creator: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    is_verified: boolean
  }
  category: {
    id: string
    name: string
    slug: string
  } | null
}

const ITEMS_PER_PAGE = 20

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [moderationModal, setModerationModal] = useState<{ product: Product; action: 'approve' | 'reject' } | null>(null)
  const [moderationNotes, setModerationNotes] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [filter, page, searchQuery])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          creator:creator_id(id, username, full_name, avatar_url, is_verified),
          category:categories(id, name, slug)
        `, { count: 'exact' })

      // Apply filters
      if (filter === 'pending') {
        query = query.eq('moderation_status', 'pending')
      } else if (filter === 'approved') {
        query = query.eq('moderation_status', 'approved')
      } else if (filter === 'rejected') {
        query = query.eq('moderation_status', 'rejected')
      } else if (filter === 'featured') {
        query = query.eq('is_featured', true)
      }

      // Apply search
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      // Pagination
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      setProducts(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleModeration = async (productId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          moderation_status: status,
          moderation_notes: notes || null,
          moderated_at: new Date().toISOString(),
          // If approved, also set status to active
          ...(status === 'approved' ? { status: 'active' } : {})
        })
        .eq('id', productId)

      if (error) throw error
      
      setModerationModal(null)
      setModerationNotes('')
      fetchProducts()
    } catch (error) {
      console.error('Failed to moderate product:', error)
    }
    setActionMenuId(null)
  }

  const handleToggleFeatured = async (productId: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: featured })
        .eq('id', productId)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Failed to toggle featured:', error)
    }
    setActionMenuId(null)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
    setActionMenuId(null)
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3" /> Pending
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        )
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <AlertCircle className="w-3 h-3" /> Under Review
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status}
          </span>
        )
    }
  }

  const filters = [
    { key: 'all', label: 'All Products' },
    { key: 'pending', label: 'Pending Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'featured', label: 'Featured' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and manage all products on your platform</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
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

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                {product.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                {product.is_featured && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" /> Featured
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(product.moderation_status || 'pending')}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{product.title}</h3>
                
                {/* Seller info */}
                <Link
                  href={`/creator/${product.creator?.username}`}
                  className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    {product.creator?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">
                        {product.creator?.username?.[0]}
                      </div>
                    )}
                  </div>
                  <span>{product.creator?.full_name || product.creator?.username}</span>
                  {product.creator?.is_verified && <CheckCircle className="w-3 h-3 text-blue-500" />}
                </Link>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> {product.views || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="w-4 h-4" /> {product.orders_count || 0}
                  </span>
                  {product.rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {product.rating}
                    </span>
                  )}
                </div>

                {/* Price & Actions */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    ${Number(product.base_price).toFixed(2)}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/product/${product.id}`}
                      target="_blank"
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === product.id ? null : product.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>

                      {actionMenuId === product.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setActionMenuId(null)}
                          />
                          <div className="absolute right-0 bottom-full mb-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                            {product.moderation_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => setModerationModal({ product, action: 'approve' })}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                                >
                                  <CheckCircle className="w-4 h-4" /> Approve
                                </button>
                                <button
                                  onClick={() => setModerationModal({ product, action: 'reject' })}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <XCircle className="w-4 h-4" /> Reject
                                </button>
                                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                              </>
                            )}
                            <button
                              onClick={() => handleToggleFeatured(product.id, !product.is_featured)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Star className={`w-4 h-4 ${product.is_featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                              {product.is_featured ? 'Remove Featured' : 'Make Featured'}
                            </button>
                            <hr className="my-1 border-gray-200 dark:border-gray-700" />
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <XCircle className="w-4 h-4" /> Delete Product
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} products
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

      {/* Moderation Modal */}
      {moderationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {moderationModal.action === 'approve' ? 'Approve Product' : 'Reject Product'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {moderationModal.product.title}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {moderationModal.action === 'reject' ? 'Rejection Reason *' : 'Notes (optional)'}
                </label>
                <textarea
                  rows={3}
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder={moderationModal.action === 'reject' ? 'Reason for rejection...' : 'Any notes...'}
                  required={moderationModal.action === 'reject'}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => { setModerationModal(null); setModerationNotes('') }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleModeration(
                  moderationModal.product.id,
                  moderationModal.action === 'approve' ? 'approved' : 'rejected',
                  moderationNotes
                )}
                disabled={moderationModal.action === 'reject' && !moderationNotes}
                className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  moderationModal.action === 'approve'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {moderationModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
