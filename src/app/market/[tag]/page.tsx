'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Search, 
  Star, 
  Clock, 
  Filter, 
  ChevronDown,
  TrendingUp,
  ArrowRight,
  Tag,
  X
} from 'lucide-react'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'
import { supabase } from '@/lib/supabase'

type ProductCard = {
  id: string
  title: string
  creatorName: string
  creator: string
  avatar?: string | null
  rating?: number | null
  reviews?: number | null
  price: number
  imageUrl?: string | null
  level?: string
  tags?: string[] | null
  deliveryTime?: string | null
  isVerified?: boolean
  categoryName?: string | null
  type?: 'product' | 'service'
}

type ProductRow = {
  id: string
  title: string
  images: string[] | null
  base_price: number | string
  rating: number | null
  reviews_count: number | null
  delivery_time: string | null
  tags: string[] | null
  type?: 'product' | 'service'
  category_data?: { name: string } | { name: string }[] | null
  creator: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    is_verified: boolean | null
  } | {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    is_verified: boolean | null
  }[] | null
}

// Convert slug to display name
function tagSlugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Convert tag to URL-friendly slug
function tagToSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const resolvedParams = React.use(params)
  const tagSlug = resolvedParams.tag
  const tagName = tagSlugToName(tagSlug)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [products, setProducts] = useState<ProductCard[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductCard[]>([])
  const [relatedTags, setRelatedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [budgetRange, setBudgetRange] = useState<string | null>(null)
  const [deliveryFilter, setDeliveryFilter] = useState<string | null>(null)
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'product' | 'service'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  
  // Helper function to get type label
  const getTypeLabel = (filter: 'all' | 'product' | 'service') => {
    if (filter === 'service') return 'services'
    if (filter === 'product') return 'products'
    return 'offerings'
  }

  // Fetch products with matching tag
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        // Search for products containing this tag (case-insensitive)
        const { data, error, count } = await supabase
          .from('products')
          .select(`
            id,
            title,
            images,
            base_price,
            rating,
            reviews_count,
            delivery_time,
            tags,
            type,
            category_data:category_id(name),
            creator:creator_id(id, username, full_name, avatar_url, is_verified)
          `, { count: 'exact' })
          .eq('status', 'active')
          .order('orders_count', { ascending: false })
          .limit(50)

        if (error) throw error
        if (!data) {
          setProducts([])
          setTotalCount(0)
          return
        }

        // Filter products that contain this tag (case-insensitive)
        const tagLower = tagSlug.replace(/-/g, ' ').toLowerCase()
        const tagVariants = [
          tagLower,
          tagSlug.toLowerCase(),
          tagName.toLowerCase()
        ]

        const filteredData = (data as ProductRow[]).filter(product => {
          if (!product.tags || product.tags.length === 0) return false
          return product.tags.some(t => {
            const tLower = t.toLowerCase()
            return tagVariants.some(variant => 
              tLower.includes(variant) || variant.includes(tLower)
            )
          })
        })

        // Collect related tags from the filtered products
        const tagSet = new Set<string>()
        filteredData.forEach(product => {
          product.tags?.forEach(t => {
            if (t.toLowerCase() !== tagName.toLowerCase() && 
                tagToSlug(t) !== tagSlug) {
              tagSet.add(t)
            }
          })
        })
        setRelatedTags(Array.from(tagSet).slice(0, 12))

        const mapped: ProductCard[] = filteredData.map((product) => {
          const creatorData = Array.isArray(product.creator) 
            ? product.creator[0] 
            : product.creator
          return {
            id: product.id,
            title: product.title,
            creatorName: creatorData?.full_name || creatorData?.username || 'Unknown',
            creator: creatorData?.username || 'unknown',
            avatar: creatorData?.avatar_url || null,
            rating: product.rating,
            reviews: product.reviews_count,
            price: typeof product.base_price === 'string' 
              ? parseFloat(product.base_price) 
              : product.base_price,
            imageUrl: product.images?.[0] || null,
            level: 'Level 2',
            tags: product.tags,
            deliveryTime: product.delivery_time ? `${product.delivery_time}` : null,
            isVerified: creatorData?.is_verified || false,
            categoryName: Array.isArray(product.category_data) 
              ? product.category_data[0]?.name 
              : product.category_data?.name || null,
            type: product.type
          }
        })

        setProducts(mapped)
        setTotalCount(mapped.length)
      } catch (err) {
        console.error('Error fetching products:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [tagSlug, tagName])

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...products]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(term) ||
        p.creatorName.toLowerCase().includes(term)
      )
    }

    // Product type filter
    if (productTypeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === productTypeFilter)
    }

    // Budget filter
    if (budgetRange) {
      const [min, max] = budgetRange.split('-').map(Number)
      filtered = filtered.filter(p => {
        if (max) return p.price >= min && p.price <= max
        return p.price >= min
      })
    }

    // Delivery filter
    if (deliveryFilter) {
      const maxDays = parseInt(deliveryFilter)
      filtered = filtered.filter(p => {
        if (!p.deliveryTime) return false
        const days = parseInt(p.deliveryTime)
        return !isNaN(days) && days <= maxDays
      })
    }

    // Sort
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'newest':
        // Already sorted by orders_count from DB
        break
      default:
        // popular - default sort
        break
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, sortBy, budgetRange, deliveryFilter, productTypeFilter])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const clearFilters = () => {
    setSearchTerm('')
    setBudgetRange(null)
    setDeliveryFilter(null)
    setProductTypeFilter('all')
    setSortBy('popular')
  }

  const hasActiveFilters = searchTerm || budgetRange || deliveryFilter || productTypeFilter !== 'all' || sortBy !== 'popular'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* SEO Header Section */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link href="/" className="hover:text-emerald-600">FomKart</Link>
            <span className="mx-2">/</span>
            <Link href="/market" className="hover:text-emerald-600">Market</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-white">{tagName}</span>
          </nav>

          {/* Tag Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Tag className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {tagName} Offerings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {filteredProducts.length} {getTypeLabel(productTypeFilter)} available
              </p>
            </div>
          </div>

          {/* SEO Description */}
          <p className="text-gray-700 dark:text-gray-300 max-w-3xl">
            Find the best {tagName.toLowerCase()} offerings on FomKart. Browse top-rated creators 
            offering professional {tagName.toLowerCase()} products and services with fast delivery and satisfaction guaranteed.
          </p>
        </div>
      </section>

      {/* Related Tags Section */}
      {relatedTags.length > 0 && (
        <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Related Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedTags.map((tag) => (
                <Link
                  key={tag}
                  href={`/market/${tagToSlug(tag)}`}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-full text-sm font-medium transition-colors border border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Product Type Filter - Centralized */}
      <section className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center">
            <div className="inline-flex rounded-lg bg-white dark:bg-gray-800 p-1 shadow-sm border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setProductTypeFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  productTypeFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setProductTypeFilter('product')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  productTypeFilter === 'product'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Digital Products
              </button>
              <button
                onClick={() => setProductTypeFilter('service')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  productTypeFilter === 'service'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Services
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${tagName.toLowerCase()} ${getTypeLabel(productTypeFilter)}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Budget Filter */}
              <select
                value={budgetRange || ''}
                onChange={(e) => setBudgetRange(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Budget</option>
                <option value="0-50">Under $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100-500">$100 - $500</option>
                <option value="500-">$500+</option>
              </select>

              {/* Delivery Filter */}
              <select
                value={deliveryFilter || ''}
                onChange={(e) => setDeliveryFilter(e.target.value || null)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Delivery Time</option>
                <option value="1">Up to 24 hours</option>
                <option value="3">Up to 3 days</option>
                <option value="7">Up to 7 days</option>
                <option value="14">Up to 14 days</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Best Rating</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No {getTypeLabel(productTypeFilter)} found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {hasActiveFilters 
                  ? 'Try adjusting your filters or search term'
                  : `No ${getTypeLabel(productTypeFilter)} tagged with "${tagName}" yet`
                }
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <Link
                  href="/category/digital-products"
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-block"
                >
                  Browse All Offerings
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredProducts.length} {productTypeFilter === 'service' ? 'services' : productTypeFilter === 'product' ? 'products' : 'offerings'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tag className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      {/* Creator Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative w-7 h-7 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0">
                          {product.avatar ? (
                            <Image
                              src={product.avatar}
                              alt={product.creatorName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-medium">
                              {product.creatorName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate flex items-center gap-1">
                          {product.creatorName}
                          {product.isVerified && (
                            <CheckBadgeIcon className="w-4 h-4 text-emerald-500" />
                          )}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-gray-900 dark:text-white font-medium line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors min-h-[2.5rem]">
                        {product.title}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.rating?.toFixed(1) || '5.0'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({product.reviews || 0})
                        </span>
                      </div>

                      {/* Price */}
                      
                      {/* Category Badge - Replaces Tags */}
                      <div className="mb-2">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">
                          {product.categoryName || (product.type === 'service' ? 'Service' : 'Digital Product')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                          Starting at
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          ${product.price.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="bg-white dark:bg-gray-800 py-12 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              About {tagName} Services on FomKart
            </h2>
            <div className="prose dark:prose-invert text-gray-600 dark:text-gray-300">
              <p>
                Looking for professional {tagName.toLowerCase()} services? FomKart connects you with 
                talented freelancers who specialize in {tagName.toLowerCase()}. Whether you need 
                quick turnaround or premium quality, our verified sellers deliver outstanding results.
              </p>
              <p>
                Our {tagName.toLowerCase()} experts offer competitive prices starting from affordable 
                rates, with various packages to suit your budget and timeline. All services come with 
                secure payments and satisfaction guarantee.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-2">
                Why Choose FomKart for {tagName}?
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Verified and rated freelancers</li>
                <li>Secure payment protection</li>
                <li>24/7 customer support</li>
                <li>Money-back guarantee</li>
                <li>Fast delivery options</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Browse More Tags CTA */}
      <section className="py-8 bg-gray-100 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Explore More Services
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/market" className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors">
              Browse All Tags
            </Link>
            <Link href="/category/services" className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600">
              All Services
            </Link>
            <Link href="/category/digital-products" className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600">
              Digital Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
