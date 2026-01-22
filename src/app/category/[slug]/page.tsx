'use client'

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Star, 
  Heart, 
  Filter, 
  ChevronDown, 
  TrendingUp,
  CheckCircle,
  X,
} from 'lucide-react'
import { 
  DevicePhoneMobileIcon,
  AcademicCapIcon,
  BoltIcon,
  ComputerDesktopIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  CameraIcon,
  CodeBracketIcon,
  VideoCameraIcon,
  UserGroupIcon
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
  categoryName?: string | null
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
  category_data?: {
    name: string
  } | null
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
  },
  'consultation': {
    name: 'Consultations',
    description: 'Expert advice and 1-on-1 coaching',
    icon: VideoCameraIcon,
    color: 'from-indigo-500 to-violet-600',
    bgColor: 'bg-gradient-to-br from-indigo-50 to-violet-100',
    iconColor: 'text-indigo-600',
    subcategories: [
      { name: 'Business Coaching', icon: BoltIcon, count: '124' },
      { name: 'Technical Consultation', icon: CodeBracketIcon, count: '89' },
      { name: 'Career Advice', icon: AcademicCapIcon, count: '231' },
      { name: 'Life Coaching', icon: Heart, count: '156' },
      { name: 'Legal Advice', icon: DocumentTextIcon, count: '45' },
    ]
  },
  'video-calls': {
    name: 'Video Calls',
    description: 'Connect with creators via video calls',
    icon: FaVideo,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-gradient-to-br from-pink-50 to-rose-100',
    iconColor: 'text-pink-600',
    subcategories: [
      { name: '1-on-1 Call', icon: FaVideo, count: '500+' },
      { name: 'Group Session', icon: UserGroupIcon, count: '100+' }
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
  ],
  'consultation': [
    'Business Coaching', 'Technical Consultation', 'Career Advice', 'Life Coaching', 'Legal Advice', 'Mentorship'
  ],
  'video-calls': [
    '1-on-1 Call', 'Group Session', 'Workshop'
  ]
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [products, setProducts] = useState<ProductCard[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Filter states
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [budgetRange, setBudgetRange] = useState<string | null>(null)
  const [deliveryTime, setDeliveryTime] = useState<string | null>(null)
  const [sellerLevel, setSellerLevel] = useState<string | null>(null)
  const [showAllFilters, setShowAllFilters] = useState(false)
  
  // Dropdown visibility states
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false)
  const [showDeliveryDropdown, setShowDeliveryDropdown] = useState(false)
  const [showLevelDropdown, setShowLevelDropdown] = useState(false)
  
  // Refs for click-outside handling
  const filterBarRef = useRef<HTMLDivElement>(null)
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target as Node)) {
        setShowBudgetDropdown(false)
        setShowDeliveryDropdown(false)
        setShowLevelDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const category = categories[resolvedParams.slug as keyof typeof categories]
  const subs = subcategories[resolvedParams.slug as keyof typeof subcategories] || []
  
  // Search functionality
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  // Apply all filters
  const applyFilters = useCallback((productsList: ProductCard[]) => {
    let filtered = [...productsList]
    
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(term) ||
        product.creatorName.toLowerCase().includes(term) ||
        (product.tags || []).some(tag => tag.toLowerCase().includes(term))
      )
    }
    
    // Subcategory filter
    if (selectedSubcategory) {
      const subLower = selectedSubcategory.toLowerCase()
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(subLower) ||
        (product.tags || []).some(tag => tag.toLowerCase().includes(subLower))
      )
    }
    
    // Budget filter
    if (budgetRange) {
      switch (budgetRange) {
        case 'under-25':
          filtered = filtered.filter(p => p.price < 25)
          break
        case '25-50':
          filtered = filtered.filter(p => p.price >= 25 && p.price <= 50)
          break
        case '50-100':
          filtered = filtered.filter(p => p.price >= 50 && p.price <= 100)
          break
        case '100-200':
          filtered = filtered.filter(p => p.price >= 100 && p.price <= 200)
          break
        case 'over-200':
          filtered = filtered.filter(p => p.price > 200)
          break
      }
    }
    
    // Delivery time filter
    if (deliveryTime) {
      filtered = filtered.filter(product => {
        if (!product.deliveryTime) return false
        const time = product.deliveryTime.toLowerCase()
        switch (deliveryTime) {
          case '24h':
            return time.includes('24') || time.includes('1 day') || time.includes('express')
          case '3days':
            return time.includes('1') || time.includes('2') || time.includes('3')
          case '7days':
            return !time.includes('week') || time.includes('1 week')
          default:
            return true
        }
      })
    }
    
    // Seller level filter
    if (sellerLevel) {
      if (sellerLevel === 'verified') {
        filtered = filtered.filter(p => p.level === 'Verified')
      }
    }
    
    return filtered
  }, [searchTerm, selectedSubcategory, budgetRange, deliveryTime, sellerLevel])

  // Update filtered products when filters change
  useEffect(() => {
    setFilteredProducts(applyFilters(products))
  }, [products, applyFilters])

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
        
        // Map slugs to product types
        // 'courses' type doesn't exist in DB, so we'll filter by tags
        const typeMap: Record<string, string | undefined> = {
          services: 'service',
          courses: undefined, // Will filter by tags for courses
          'digital-products': 'product',
          'consultation': 'service',
          'video-calls': 'service'
        }
        const selectedType = typeMap[slug]

        let query = supabase
          .from('products')
          .select('id, title, images, base_price, rating, reviews_count, delivery_time, tags, type, category_data:category_id(name), creator:creator_id(id, username, full_name, avatar_url, is_verified)')
          .eq('status', 'active')

        // For digital-products and services, filter by type
        if (selectedType) {
          query = query.eq('type', selectedType)
        }

        const { data } = await query
          .order('orders_count', { ascending: false })
          .limit(40)

        const rows = (data ?? []) as unknown as (ProductRow & { type?: string })[]
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
            deliveryTime: p.delivery_time || null,
            categoryName: p.category_data?.name || null
          }
        })

        // For courses: strictly filter to only items that have course-related keywords
        if (slug === 'courses') {
          const courseTerms = ['course', 'tutorial', 'class', 'learn', 'training', 'lesson', 'education', 'teach', 'workshop']
          const hasTerm = (s?: string) => {
            if (!s) return false
            const lower = s.toLowerCase()
            return courseTerms.some(t => lower.includes(t))
          }
          const isCourse = (p: ProductCard) => {
            // Check title
            if (hasTerm(p.title)) return true
            // Check tags - must have at least one course-related tag
            if (p.tags && p.tags.some(tag => hasTerm(tag))) return true
            return false
          }
          mapped = mapped.filter(isCourse)
        }

        // For consultation
        if (slug === 'consultation') {
          const terms = ['consult', 'coach', 'mentor', 'advice', 'session', 'review', 'audit', 'strategy', 'help']
          const hasTerm = (s?: string) => {
            if (!s) return false
            const lower = s.toLowerCase()
            return terms.some(t => lower.includes(t))
          }
          mapped = mapped.filter(p => hasTerm(p.title) || (p.tags && p.tags.some(tag => hasTerm(tag))))
        }
        
        // For video-calls
        if (slug === 'video-calls') {
          const terms = ['video', 'call', 'zoom', 'meet', 'facetime', 'live', 'talk', 'chat']
          const hasTerm = (s?: string) => {
            if (!s) return false
            const lower = s.toLowerCase()
            return terms.some(t => lower.includes(t))
          }
          mapped = mapped.filter(p => hasTerm(p.title) || (p.tags && p.tags.some(tag => hasTerm(tag))))
        }
        
        // For digital-products: exclude items that look like courses
        if (slug === 'digital-products') {
          const courseTerms = ['course', 'tutorial', 'class', 'training', 'lesson', 'workshop']
          const hasTerm = (s?: string) => {
            if (!s) return false
            const lower = s.toLowerCase()
            return courseTerms.some(t => lower.includes(t))
          }
          mapped = mapped.filter(p => !hasTerm(p.title) && !(p.tags?.some(tag => hasTerm(tag))))
        }

        // Derive rating + review count from the reviews table (keeps consistent with homepage)
        // This prevents stale/empty product.rating and product.reviews_count values from showing 0.
        const productIds = mapped.map((p) => p.id)
        if (productIds.length) {
          type ProductRatingRow = { product_id: string | null; rating: number | null }
          const { data: ratingRows } = await supabase
            .from('reviews')
            .select('product_id, rating')
            .eq('is_public', true)
            .in('product_id', productIds)
            .not('rating', 'is', null)

          const totals = new Map<string, { sum: number; count: number }>()
          for (const row of (ratingRows as ProductRatingRow[] | null) ?? []) {
            if (!row?.product_id) continue
            const ratingValue = Number(row.rating)
            if (!Number.isFinite(ratingValue) || ratingValue <= 0) continue
            const current = totals.get(row.product_id) ?? { sum: 0, count: 0 }
            current.sum += ratingValue
            current.count += 1
            totals.set(row.product_id, current)
          }

          mapped = mapped.map((product) => {
            const aggregate = totals.get(product.id)
            if (!aggregate || aggregate.count === 0) return product
            const average = Math.round((aggregate.sum / aggregate.count) * 10) / 10
            return {
              ...product,
              rating: average,
              reviews: aggregate.count
            }
          })
        }

        setProducts(mapped)
        // Filtering will be handled by the applyFilters effect
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
      <div className="min-h-screen flex items-center justify-center px-4 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Category not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">The category you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/category/digital-products" className="mt-4 inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
            Browse Digital Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Note: Global header is provided by RootLayout. Page-level header removed to avoid duplication. */}

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-emerald-600 dark:hover:text-emerald-400">FomKart</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-white truncate">{category.name}</span>
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
          </div>
        </div>
      </div>

      {/* Subcategories */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Explore {category.name}</h2>
          <div className="flex flex-wrap gap-2">
            {subs.map((sub, index) => (
              <button 
                key={index} 
                onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? null : sub)}
                className={`px-3 sm:px-4 py-2 rounded-full text-sm transition-colors ${
                  selectedSubcategory === sub 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 text-gray-700 dark:text-gray-300'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Filter Bar */}
        <div ref={filterBarRef} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            {/* In-page Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search in ${category.name}...`}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            {/* All Filters Button */}
            <button 
              onClick={() => setShowAllFilters(!showAllFilters)}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 border rounded-lg text-sm transition-colors ${
                showAllFilters ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>All Filters</span>
            </button>
            
            {/* Budget Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowBudgetDropdown(!showBudgetDropdown)
                  setShowDeliveryDropdown(false)
                  setShowLevelDropdown(false)
                }}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 border rounded-lg text-sm transition-colors ${
                  budgetRange ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{budgetRange ? `$${budgetRange.replace('-', ' - $').replace('under-', 'Under $').replace('over-', 'Over $')}` : 'Budget'}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {showBudgetDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <button onClick={() => { setBudgetRange(null); setShowBudgetDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Any Budget</button>
                  <button onClick={() => { setBudgetRange('under-25'); setShowBudgetDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Under $25</button>
                  <button onClick={() => { setBudgetRange('25-50'); setShowBudgetDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">$25 - $50</button>
                  <button onClick={() => { setBudgetRange('50-100'); setShowBudgetDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">$50 - $100</button>
                  <button onClick={() => { setBudgetRange('100-200'); setShowBudgetDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">$100 - $200</button>
                  <button onClick={() => { setBudgetRange('over-200'); setShowBudgetDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Over $200</button>
                </div>
              )}
            </div>
            
            {/* Delivery Time Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowDeliveryDropdown(!showDeliveryDropdown)
                  setShowBudgetDropdown(false)
                  setShowLevelDropdown(false)
                }}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 border rounded-lg text-sm transition-colors ${
                  deliveryTime ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="hidden sm:inline">{deliveryTime ? (deliveryTime === '24h' ? '24 Hours' : deliveryTime === '3days' ? 'Up to 3 Days' : 'Up to 7 Days') : 'Delivery Time'}</span>
                <span className="sm:hidden">{deliveryTime ? (deliveryTime === '24h' ? '24h' : deliveryTime === '3days' ? '3 Days' : '7 Days') : 'Delivery'}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {showDeliveryDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <button onClick={() => { setDeliveryTime(null); setShowDeliveryDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Any Time</button>
                  <button onClick={() => { setDeliveryTime('24h'); setShowDeliveryDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">24 Hours</button>
                  <button onClick={() => { setDeliveryTime('3days'); setShowDeliveryDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Up to 3 Days</button>
                  <button onClick={() => { setDeliveryTime('7days'); setShowDeliveryDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Up to 7 Days</button>
                </div>
              )}
            </div>
            
            {/* Seller Level Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowLevelDropdown(!showLevelDropdown)
                  setShowBudgetDropdown(false)
                  setShowDeliveryDropdown(false)
                }}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 border rounded-lg text-sm transition-colors ${
                  sellerLevel ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="hidden sm:inline">{sellerLevel ? 'Verified Only' : 'Seller Level'}</span>
                <span className="sm:hidden">{sellerLevel ? 'Verified' : 'Level'}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {showLevelDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <button onClick={() => { setSellerLevel(null); setShowLevelDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Any Level</button>
                  <button onClick={() => { setSellerLevel('verified'); setShowLevelDropdown(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Verified Sellers Only</button>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <span className="text-sm text-gray-600 dark:text-gray-400">{displayedProducts.length} services available</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm w-full sm:w-auto bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="popular">Best Selling</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedSubcategory || budgetRange || deliveryTime || sellerLevel) && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
            {selectedSubcategory && (
              <button 
                onClick={() => setSelectedSubcategory(null)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm"
              >
                {selectedSubcategory}
                <span className="ml-1">×</span>
              </button>
            )}
            {budgetRange && (
              <button 
                onClick={() => setBudgetRange(null)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm"
              >
                {budgetRange.replace('-', ' - $').replace('under-', 'Under $').replace('over-', 'Over $')}
                <span className="ml-1">×</span>
              </button>
            )}
            {deliveryTime && (
              <button 
                onClick={() => setDeliveryTime(null)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm"
              >
                {deliveryTime === '24h' ? '24 Hours' : deliveryTime === '3days' ? 'Up to 3 Days' : 'Up to 7 Days'}
                <span className="ml-1">×</span>
              </button>
            )}
            {sellerLevel && (
              <button 
                onClick={() => setSellerLevel(null)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm"
              >
                Verified Only
                <span className="ml-1">×</span>
              </button>
            )}
            <button 
              onClick={() => {
                setSelectedSubcategory(null)
                setBudgetRange(null)
                setDeliveryTime(null)
                setSellerLevel(null)
              }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Search Results Info */}
        {searchTerm && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Showing {displayedProducts.length} results for &quot;<strong>{searchTerm}</strong>&quot;
              {displayedProducts.length === 0 && (
                <span className="block mt-2 text-blue-600 dark:text-blue-400">
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
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
                <div className="p-3 sm:p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
                      <div className="h-2 bg-gray-100 dark:bg-gray-600 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-3" />
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                  </div>
                </div>
              </div>
            ))
          )}
          {displayedProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="group" prefetch>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100 dark:border-gray-700">
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
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-sm flex-shrink-0">
                      {product.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.avatar} alt={product.creatorName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-gray-600 dark:text-gray-400">{product.creatorName.slice(0,1)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-white block truncate">
                        {product.creatorName}
                      </span>
                      {product.level && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center truncate">
                            <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0 text-emerald-600" />
                            <span className="truncate">{product.level}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 leading-5 text-sm sm:text-base">
                    {product.title}
                  </h3>
                  
                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-3">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{Number(product.rating ?? 0).toFixed(1)}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({product.reviews ?? 0})</span>
                  </div>
                  
                  {/* Category - Replaces Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded truncate font-medium">
                      {product.categoryName || category.name}
                    </span>
                  </div>
                  
                  {/* Price */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Starting at</span>
                    <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                      From ${product.price}
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
            <button className="bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-600 dark:border-emerald-500 px-6 sm:px-8 py-3 rounded-lg hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-colors font-semibold w-full sm:w-auto">
              Load More {category.name}
            </button>
          </div>
        )}

        {/* No Results */}
        {displayedProducts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No results</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting your search terms or browse all {category.name.toLowerCase()}.</p>
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

        {/* Popular Tags Section for SEO */}
        {products.length > 0 && Array.from(new Set(products.flatMap(p => p.tags || []))).length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular Tags in {category.name}</h2>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(products.flatMap(p => p.tags || []))).slice(0, 20).map((tag) => (
                <Link
                  key={tag}
                  href={`/market/${tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-full text-sm transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Page-specific footer removed; use global footer if added to layout */}
    </div>
  )
}
