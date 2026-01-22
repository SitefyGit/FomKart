import { Metadata } from 'next'
import Link from 'next/link'
import { TrendingUp, Star, Sparkles, Zap, Users, Shield, ArrowRight } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import MarketSearch from '@/components/MarketSearch'

export const metadata: Metadata = {
  title: 'Explore Services | FomKart Marketplace',
  description: 'Discover thousands of professional services on FomKart. Find freelancers for affiliate marketing, web design, SEO, digital products, and more.',
  openGraph: {
    title: 'Explore Services | FomKart Marketplace',
    description: 'Discover thousands of professional services. Find the perfect freelancer for your project.',
    type: 'website',
  },
}

// Convert tag to URL-friendly slug
function tagToSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Pre-defined popular tag categories for SEO
const popularTagCategories = [
  {
    name: 'Digital Marketing',
    icon: TrendingUp,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    tags: [
      'Affiliate Marketing',
      'SEO',
      'Social Media Marketing',
      'Email Marketing',
      'Content Marketing',
      'PPC Advertising',
      'Influencer Marketing',
      'Brand Strategy',
    ]
  },
  {
    name: 'Development',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    tags: [
      'Web Development',
      'WordPress',
      'React',
      'Node.js',
      'Python',
      'Mobile App',
      'E-commerce',
      'API Development',
    ]
  },
  {
    name: 'Design & Creative',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    tags: [
      'Logo Design',
      'UI/UX Design',
      'Graphic Design',
      'Brand Identity',
      'Web Design',
      'Illustration',
      'Packaging Design',
      'Social Media Design',
    ]
  },
  {
    name: 'Writing & Content',
    icon: Star,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    tags: [
      'Content Writing',
      'Copywriting',
      'Blog Writing',
      'Technical Writing',
      'Translation',
      'Proofreading',
      'Resume Writing',
      'Ghostwriting',
    ]
  },
  {
    name: 'Video & Animation',
    icon: Star,
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    tags: [
      'Video Editing',
      'Animation',
      'Motion Graphics',
      'Explainer Video',
      'YouTube Editing',
      'Whiteboard Animation',
      '3D Animation',
      'Intro & Outro',
    ]
  },
  {
    name: 'Business Services',
    icon: Users,
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    tags: [
      'Business Plan',
      'Market Research',
      'Financial Analysis',
      'Virtual Assistant',
      'Data Entry',
      'Project Management',
      'Consulting',
      'Presentations',
    ]
  },
]

// Featured/Popular searches for quick access
const featuredSearches = [
  { name: 'Affiliate Marketing', hot: true },
  { name: 'Logo Design', hot: true },
  { name: 'Website Development', hot: false },
  { name: 'SEO Services', hot: true },
  { name: 'Video Editing', hot: false },
  { name: 'Social Media', hot: false },
  { name: 'WordPress', hot: false },
  { name: 'Copywriting', hot: false },
  { name: 'Virtual Assistant', hot: false },
  { name: 'Amazon FBA', hot: true },
  { name: 'Shopify', hot: false },
  { name: 'Landing Page', hot: false },
]

// Server component to fetch trending tags from database
async function getTrendingTags(): Promise<{ tag: string; count: number }[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return []
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: products, error } = await supabase
      .from('products')
      .select('tags')
      .eq('status', 'active')
      .not('tags', 'is', null)

    if (error || !products) {
      return []
    }

    const tagCounts = new Map<string, number>()
    products.forEach((product) => {
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach((tag: string) => {
          const normalizedTag = tag.trim()
          if (normalizedTag) {
            tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1)
          }
        })
      }
    })

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
  } catch (err) {
    console.error('Error fetching trending tags:', err)
    return []
  }
}

export default async function MarketPage() {
  const trendingTags = await getTrendingTags()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Discover 10,000+ Services
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Find the Perfect
              <span className="block text-yellow-300">Service for You</span>
            </h1>
            
            <p className="text-lg sm:text-xl mb-10 opacity-90 max-w-2xl mx-auto">
              Browse our curated marketplace of professional services. 
              From marketing to development, find verified experts ready to help.
            </p>
            
            {/* Search Bar */}
            <MarketSearch />

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm opacity-80">Services</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">5K+</div>
                <div className="text-sm opacity-80">Freelancers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm opacity-80">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Searches - Quick Access */}
      <section className="py-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Popular:</span>
            {featuredSearches.map(({ name, hot }) => (
              <Link
                key={name}
                href={`/market/${tagToSlug(name)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-full text-sm font-medium transition-all whitespace-nowrap"
              >
                {name}
                {hot && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold">HOT</span>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Tags from Database */}
      {trendingTags.length > 0 && (
        <section className="py-12 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Trending Now
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Most searched services this week</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {trendingTags.map(({ tag, count }, index) => (
                <Link
                  key={tag}
                  href={`/market/${tagToSlug(tag)}`}
                  className="group relative p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg transition-all"
                >
                  {index < 3 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                  )}
                  <div className="font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors truncate">
                    {tag}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {count} services
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Explore by Category
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Find exactly what you need from our organized collection of professional services
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularTagCategories.map((category) => (
              <div
                key={category.name}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Category Header */}
                <div className={`p-6 ${category.bgColor}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <category.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {category.tags.length} subcategories
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Tags List */}
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {category.tags.slice(0, 6).map((tag) => (
                      <Link
                        key={tag}
                        href={`/market/${tagToSlug(tag)}`}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg text-sm transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                    {category.tags.length > 6 && (
                      <span className="px-3 py-1.5 text-gray-400 dark:text-gray-500 text-sm">
                        +{category.tags.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Secure Payments</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Your payments are protected with bank-level security</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Verified Sellers</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">All freelancers are verified for quality assurance</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Quality Guarantee</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Not satisfied? Get your money back, no questions</p>
            </div>
          </div>
        </div>
      </section>

      {/* All Categories List - SEO Section */}
      <section className="py-12 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            All Service Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
            {popularTagCategories.flatMap(cat => cat.tags).map((tag) => (
              <Link
                key={tag}
                href={`/market/${tagToSlug(tag)}`}
                className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm transition-colors truncate"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who found their perfect service on FomKart
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/category/services"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse All Services
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/auth/creator-signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-700 text-white rounded-xl font-semibold hover:bg-emerald-800 transition-colors"
            >
              Become a Seller
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
