import { Metadata } from 'next'
import Link from 'next/link'
import { Tag, TrendingUp, ArrowRight, Search, Star } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

export const metadata: Metadata = {
  title: 'Browse Services by Tags | FomKart',
  description: 'Explore all service categories and popular tags on FomKart. Find freelancers for affiliate marketing, web design, SEO, digital products, and more.',
  openGraph: {
    title: 'Browse Services by Tags | FomKart',
    description: 'Explore all service categories and popular tags on FomKart. Find the perfect freelancer for your project.',
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
    name: 'Marketing',
    icon: TrendingUp,
    color: 'bg-blue-500',
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
    icon: Tag,
    color: 'bg-purple-500',
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
    name: 'Design',
    icon: Star,
    color: 'bg-pink-500',
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
    name: 'Writing',
    icon: Tag,
    color: 'bg-emerald-500',
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
    icon: Tag,
    color: 'bg-red-500',
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
    name: 'Business',
    icon: Tag,
    color: 'bg-amber-500',
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

// Server component to fetch trending tags from database
async function getTrendingTags(): Promise<{ tag: string; count: number }[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return []
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all active products with tags
    const { data: products, error } = await supabase
      .from('products')
      .select('tags')
      .eq('status', 'active')
      .not('tags', 'is', null)

    if (error || !products) {
      return []
    }

    // Count tag occurrences
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

    // Sort by count and return top tags
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30)
  } catch (err) {
    console.error('Error fetching trending tags:', err)
    return []
  }
}

export default async function GigsIndexPage() {
  const trendingTags = await getTrendingTags()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Browse Services by Tag
          </h1>
          <p className="text-lg sm:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Discover thousands of services organized by categories. Find exactly what you need 
            from our verified freelancers.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for any service..."
              className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 text-lg shadow-lg focus:ring-4 focus:ring-white/30 outline-none"
            />
          </div>
        </div>
      </section>

      {/* Trending Tags from Database */}
      {trendingTags.length > 0 && (
        <section className="py-12 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Trending Tags
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {trendingTags.map(({ tag, count }) => (
                <Link
                  key={tag}
                  href={`/gigs/${tagToSlug(tag)}`}
                  className="group px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-full text-sm font-medium transition-all border border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600 flex items-center gap-2"
                >
                  <span>{tag}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-emerald-600">
                    ({count})
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tag Categories */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Browse by Category
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularTagCategories.map((category) => (
              <div
                key={category.name}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                {/* Category Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${category.color} rounded-xl flex items-center justify-center`}>
                      <category.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                  </div>
                </div>
                
                {/* Tags List */}
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {category.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/gigs/${tagToSlug(tag)}`}
                        className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg text-sm transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Searches SEO Section */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Popular Searches
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              'Affiliate Marketing',
              'Logo Design',
              'Website Development',
              'SEO Services',
              'Video Editing',
              'Social Media',
              'WordPress',
              'Copywriting',
              'Virtual Assistant',
              'Amazon FBA',
              'Shopify',
              'Landing Page',
            ].map((term) => (
              <Link
                key={term}
                href={`/gigs/${tagToSlug(term)}`}
                className="text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm transition-colors"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="py-12 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Find the Perfect Service on FomKart
            </h2>
            <div className="prose dark:prose-invert text-gray-600 dark:text-gray-300">
              <p>
                FomKart is your one-stop marketplace for professional freelance services. 
                Browse our extensive collection of services organized by tags to find exactly 
                what you need. From affiliate marketing experts to talented web developers, 
                our verified freelancers deliver quality work at competitive prices.
              </p>
              <p>
                Each tag page showcases the best freelancers in that specialty, complete with 
                ratings, reviews, and portfolio samples. Whether you need help with SEO, logo 
                design, video editing, or any other service, FomKart connects you with skilled 
                professionals ready to bring your vision to life.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
