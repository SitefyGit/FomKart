'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Star, 
  Clock, 
  Heart, 
  Filter, 
  ChevronDown, 
  TrendingUp,
  CheckCircle,
  
} from 'lucide-react'
import { 
  DevicePhoneMobileIcon,
  AcademicCapIcon,
  BoltIcon,
  ComputerDesktopIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  CameraIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline'
import {
  FaReact,
  FaVideo
} from 'react-icons/fa'
import { SiAdobephotoshop } from 'react-icons/si'
import { supabase } from '@/lib/supabase'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'

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
  creator: (
  {
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
  }[]
  ) | null
}

const categories = {
  'digital-products': {
    name: 'Digital Products',
    description: 'Templates, graphics, apps, and digital assets to power your business',
    icon: DevicePhoneMobileIcon,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    iconColor: 'text-blue-600',
    subcategories: [
      { name: 'Website Templates', icon: ComputerDesktopIcon, count: '2,847' },
      { name: 'Graphics & Design', icon: PaintBrushIcon, count: '1,923' },
      { name: 'Mobile Apps', icon: DevicePhoneMobileIcon, count: '756' },
      { name: 'Documents', icon: DocumentTextIcon, count: '1,234' },
      { name: 'Code & Scripts', icon: CodeBracketIcon, count: '892' },
    ]
  },
  'courses': {
    name: 'Online Courses',
    description: 'Learn new skills from world-class instructors and advance your career',
    icon: AcademicCapIcon,
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-gradient-to-br from-purple-50 to-pink-100',
    iconColor: 'text-purple-600',
    subcategories: [
      { name: 'Business', icon: BoltIcon, count: '1,543' },
      { name: 'Technology', icon: CodeBracketIcon, count: '2,123' },
      { name: 'Design', icon: PaintBrushIcon, count: '987' },
      { name: 'Marketing', icon: TrendingUp, count: '1,234' },
      { name: 'Photography', icon: CameraIcon, count: '678' },
    ]
  },
  'services': {
    name: 'Professional Services',
    description: 'Get expert help from freelancers and agencies worldwide',
    icon: BoltIcon,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-100',
    iconColor: 'text-emerald-600',
    subcategories: [
      { name: 'Web Development', icon: FaReact, count: '3,456' },
      { name: 'Graphic Design', icon: SiAdobephotoshop, count: '2,789' },
      { name: 'Digital Marketing', icon: TrendingUp, count: '1,876' },
      { name: 'Content Writing', icon: DocumentTextIcon, count: '1,543' },
      { name: 'Video Editing', icon: FaVideo, count: '1,234' },
    ]
  }
}

// Note: Previously mockProducts were used. We now load real products from Supabase.

const subcategories = {
  'digital-products': [
    'Website Templates', 'Mobile Apps', 'Desktop Software', 'Plugins & Extensions',
    'Graphics & Design Assets', 'Stock Photos', 'Audio & Music', 'eBooks & Guides'
  ],
  'courses': [
    'Web Development', 'Design', 'Business', 'Marketing', 'Photography',
    'Music', 'Lifestyle', 'Programming', 'Languages'
  ],
  'services': [
    'Web Development', 'Graphic Design', 'Digital Marketing', 'Writing & Translation',
    'Video & Animation', 'Music & Audio', 'Programming', 'Business Consulting'
  ]
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [products, setProducts] = useState<ProductCard[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const category = categories[resolvedParams.slug as keyof typeof categories]
  const subs = subcategories[resolvedParams.slug as keyof typeof subcategories] || []
  
  // Search functionality
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    if (value.trim() === '') {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(product =>
        product.title.toLowerCase().includes(value.toLowerCase()) ||
        product.creatorName.toLowerCase().includes(value.toLowerCase()) ||
        (product.tags || []).some(tag => tag.toLowerCase().includes(value.toLowerCase()))
      )
      setFilteredProducts(filtered)
    }
  }, [products])

  // Initialize search from URL parameters
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const searchParam = urlParams.get('search')
    if (searchParam) {
      handleSearchChange(searchParam)
    }
  }, [handleSearchChange])

  // Load products for this category and subscribe to realtime changes
  useEffect(() => {
  async function load() {
  try {
    setIsLoading(true)
        const slug = resolvedParams.slug
        const typeMap: Record<string, string | undefined> = {
          services: 'service',
          courses: undefined, // courses currently use products table; filter by tags later if needed
          'digital-products': 'product'
        }
        const selectedType = typeMap[slug]

        let query = supabase
          .from('products')
          .select('id, title, images, base_price, rating, reviews_count, delivery_time, tags, creator:creator_id(id, username, full_name, avatar_url, is_verified)')
          .eq('status', 'active')

        if (selectedType) {
          query = query.eq('type', selectedType)
        }

        const { data } = await query
          .order('orders_count', { ascending: false })
          .limit(40)

        const rows = (data ?? []) as unknown as ProductRow[]
        let mapped: ProductCard[] = rows.map((p) => {
          const c = Array.isArray(p.creator) ? p.creator[0] : p.creator
          return {
            id: p.id,
            title: p.title,
            creator: c?.username || 'unknown',
            creatorName: c?.full_name || c?.username || 'Creator',
            avatar: c?.avatar_url || null,
            rating: p.rating ?? 0,
            reviews: p.reviews_count ?? 0,
            price: Number(p.base_price) || 0,
            imageUrl: Array.isArray(p.images) && p.images.length ? p.images[0] : null,
            level: c?.is_verified ? 'Verified' : undefined,
            tags: p.tags || [],
            deliveryTime: p.delivery_time || null
          }
        })

        // Refine for courses slug: prioritize items that look like courses
        if (slug === 'courses') {
          const terms = ['course', 'courses', 'tutorial', 'class', 'learn', 'training']
          const hasTerm = (s?: string) => !!s && terms.some(t => s.toLowerCase().includes(t))
          const tagHasTerm = (tags?: string[] | null) => (tags || []).some(tag => hasTerm(tag))
          const filtered = mapped.filter(p => hasTerm(p.title) || tagHasTerm(p.tags))
          if (filtered.length > 0) mapped = filtered
        }

        setProducts(mapped)
        // If no active search term, show all; else re-apply filter
        if (!searchTerm.trim()) {
          setFilteredProducts(mapped)
        } else {
          const term = searchTerm.toLowerCase()
          setFilteredProducts(mapped.filter((product) =>
            product.title.toLowerCase().includes(term) ||
            product.creatorName.toLowerCase().includes(term) ||
            (product.tags || []).some(tag => tag.toLowerCase().includes(term))
          ))
        }
      } finally {
        setIsLoading(false)
      }
    }

    load()
    const channel = supabase.channel(`category-realtime-${resolvedParams.slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => load())
      .subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.slug])
  
  

  // Memoized filtered results
  const displayedProducts = useMemo(() => {
    let result = filteredProducts

    // Sort products
    switch (sortBy) {
      case 'newest':
  // Without created_at field, keep current order for newest
  result = [...result]
        break
      case 'price-low':
        result = [...result].sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result = [...result].sort((a, b) => b.price - a.price)
        break
      case 'rating':
  result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        break
      default: // popular
  result = [...result].sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))
    }

    return result
  }, [filteredProducts, sortBy])
  
  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Category not found</h1>
          <p className="text-gray-600 mt-2">The category you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/category/digital-products" className="mt-4 inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
            Browse Digital Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Note: Global header is provided by RootLayout. Page-level header removed to avoid duplication. */}

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center text-sm text-gray-500">
            <Link href="/" className="hover:text-emerald-600">FomKart</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 truncate">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Category Hero */}
      <div className={`bg-gradient-to-r ${category.color} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <category.icon className="w-16 h-16 sm:w-20 sm:h-20" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">{category.name}</h1>
            <p className="text-base sm:text-lg lg:text-xl opacity-90 max-w-2xl mx-auto px-4">{category.description}</p>
            <div className="mt-4 sm:mt-6">
              <span className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full text-sm">
                {displayedProducts.length}+ services available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategories */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Explore {category.name}</h2>
          <div className="flex flex-wrap gap-2">
            {subs.map((sub, index) => (
              <button key={index} className="px-3 sm:px-4 py-2 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 text-gray-700 rounded-full text-sm transition-colors">
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {/* In-page Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search in ${category.name}...`}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <Filter className="h-4 w-4" />
              <span>All Filters</span>
            </button>
            <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <span>Budget</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <span className="hidden sm:inline">Delivery Time</span>
              <span className="sm:hidden">Delivery</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className="flex items-center space-x-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <span className="hidden sm:inline">Seller Level</span>
              <span className="sm:hidden">Level</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <span className="text-sm text-gray-600">{displayedProducts.length} services available</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
            >
              <option value="popular">Best Selling</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Search Results Info */}
        {searchTerm && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Showing {displayedProducts.length} results for &quot;<strong>{searchTerm}</strong>&quot;
              {displayedProducts.length === 0 && (
                <span className="block mt-2 text-blue-600">
                  Try different keywords or browse all {category.name.toLowerCase()}
                </span>
              )}
            </p>
            {displayedProducts.length === 0 && (
              <button
                onClick={() => handleSearchChange('')}
                className="mt-3 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {isLoading && filteredProducts.length === 0 && (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <div className="p-3 sm:p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                      <div className="h-2 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-5/6 mb-3" />
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="h-3 bg-gray-200 rounded w-16" />
                    <div className="h-4 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              </div>
            ))
          )}
          {displayedProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="group" prefetch>
              <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100">
                {/* Product Image */}
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl sm:text-6xl relative">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <ComputerDesktopIcon className="w-10 h-10 text-emerald-600" />
                  )}
                  <div className="absolute top-3 right-3">
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-white hover:text-red-500 cursor-pointer drop-shadow-lg" />
                  </div>
                  {product.level && (
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white text-xs px-2 py-1 rounded inline-flex items-center gap-1">
                      <CheckBadgeIcon className="w-4 h-4 text-white" />
                      {product.level}
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="p-3 sm:p-4">
                  {/* Creator Info */}
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-sm flex-shrink-0">
                      {product.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.avatar} alt={product.creatorName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-gray-600">{product.creatorName.slice(0,1)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 block truncate">
                        {product.creatorName}
                      </span>
                      {product.level && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <span className="inline-flex items-center truncate">
                            <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0 text-emerald-600" />
                            <span className="truncate">{product.level}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 leading-5 text-sm sm:text-base">
                    {product.title}
                  </h3>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-3">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-900">{product.rating ?? 0}</span>
                    <span className="text-sm text-gray-500">({product.reviews ?? 0})</span>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.tags?.slice(0, 2).map((tag, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded truncate">
                        {tag}
                      </span>
                    ))}
                    {product.tags && product.tags.length > 2 && (
                      <span className="text-xs text-gray-500 px-2 py-1">+{product.tags.length - 2}</span>
                    )}
                  </div>
                  
                  {/* Price & Delivery */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">{product.deliveryTime || '—'}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-bold text-gray-900">
                        From ${product.price}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Load More */}
        {displayedProducts.length > 0 && !isLoading && (
          <div className="text-center mt-8 sm:mt-12">
            <button className="bg-white text-emerald-600 border-2 border-emerald-600 px-6 sm:px-8 py-3 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors font-semibold w-full sm:w-auto">
              Load More {category.name}
            </button>
          </div>
        )}

        {/* No Results */}
        {displayedProducts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search terms or browse all {category.name.toLowerCase()}.</p>
            {searchTerm ? (
              <button
                onClick={() => handleSearchChange('')}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 font-semibold"
              >
                Clear search
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Page-specific footer removed; use global footer if added to layout */}
    </div>
  )
}
