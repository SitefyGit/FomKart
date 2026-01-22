import React from 'react'
import Link from 'next/link'
import { TrendingUp, ArrowRight, ShieldCheck, BadgeCheck } from 'lucide-react'
import { CubeIcon, BookOpenIcon, BoltIcon, SparklesIcon, CheckCircleIcon, VideoCameraIcon } from '@heroicons/react/24/solid'
import { HomeLeadCapture } from './HomeClientWidgets'
import TopCreatorsSection from '@/app/top-creators'
import FeaturedServicesSection from '@/app/featured-services'
import StartSellingButton from '@/components/StartSellingButton'

const featuredCategories = [
  {
    name: 'Digital Products',
    slug: 'digital-products',
    icon: CubeIcon,
    description: 'Templates, graphics, and digital assets',
    color: 'bg-blue-500',
    count: '2,847 offerings'
  },
  {
    name: 'Online Courses',
    slug: 'courses',
    icon: BookOpenIcon,
    description: 'Learn new skills and advance your career',
    color: 'bg-purple-500',
    count: '1,293 courses'
  },
  {
    name: 'Consultations',
    slug: 'consultation',
    icon: VideoCameraIcon,
    description: 'Expert advice and 1-on-1 coaching',
    color: 'bg-indigo-500',
    count: '894 sessions'
  },
  {
    name: 'Custom Services',
    slug: 'services',
    icon: BoltIcon,
    description: 'Professional services and consulting',
    color: 'bg-emerald-500',
    count: '4,156 services'
  }
]

type Creator = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  is_verified: boolean | null
  total_sales: number | null
  rating: number | null
  total_reviews: number | null
  specialty?: string | null
}

type Service = {
  id: string
  title: string
  images: string[] | null
  base_price: number
  rating: number | null
  reviews_count: number | null
  creator: { id: string, full_name: string | null, username: string, avatar_url: string | null }
}

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 py-24 sm:py-32">
        {/* Background Gradients & Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/40 via-slate-950/80 to-slate-950" />
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '2s'}} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30 mb-8 bg-emerald-500/10 backdrop-blur-sm animate-fade-in-up">
            ✨ The marketplace for creators
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 drop-shadow-sm">
            Find the perfect offering <br className="hidden sm:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              for your business
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect with talented creators offering digital products, courses, and custom services. 
            From design to development, find everything you need to grow.
          </p>
          
          {/* Lightweight search form using GET to avoid client handlers */}
          <form action="/category/digital-products" method="get" className="max-w-xl mx-auto mb-8 hidden">
            <input type="text" name="search" placeholder="Search offerings..." className="w-full px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none backdrop-blur-sm transition-all" />
          </form>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              href="/category/digital-products" 
              prefetch
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-all duration-300 hover:scale-105 shadow-[0_0_20px_rgba(5,150,105,0.4)] hover:shadow-[0_0_30px_rgba(5,150,105,0.6)] flex items-center justify-center gap-2"
            >
              Browse Offerings <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="w-full sm:w-auto">
              <StartSellingButton />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 text-xs font-medium mb-3">
              <SparklesIcon className="w-4 h-4" />
              Curated for quality
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">Explore our categories</h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">Discover the perfect offering for your needs</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {featuredCategories.map((category, index) => (
              <Link 
                key={category.slug}
                href={`/category/${category.slug}`}
                prefetch={true}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:scale-[1.03] hover:-translate-y-2 border border-gray-100 dark:border-gray-700"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="p-6 sm:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-gray-50 dark:to-gray-900/40 rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500"></div>
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 ${category.color} rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-all duration-300 relative z-10 group-hover:rotate-6 shadow-[0_8px_20px_rgba(0,0,0,0.12)]`}>
                    <category.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 transition-colors duration-300">
                    {category.name}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-1 rounded-full inline-flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {category.count}
                    </span>
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 group-hover:text-emerald-600 group-hover:translate-x-2 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Trust badges */}
          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <BadgeCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Verified creators</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Handpicked quality profiles</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Secure payments</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Protected checkout flow</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Satisfaction focus</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Clear deliverables, refund policy</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Creators (synchronous) */}
      <TopCreatorsSection />

      {/* Featured Services (synchronous) */}
      <FeaturedServicesSection />

      {/* Popular Tags Section for SEO */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Popular Offerings
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Explore trending categories and find exactly what you need
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Affiliate Marketing',
              'Logo Design',
              'SEO',
              'WordPress',
              'Video Editing',
              'Social Media',
              'Web Development',
              'Copywriting',
              'Amazon FBA',
              'Shopify',
              'UI/UX Design',
              'Content Writing',
            ].map((tag) => (
              <Link
                key={tag}
                href={`/market/${tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-full text-sm font-medium transition-all border border-gray-200 dark:border-gray-600 hover:border-emerald-300"
              >
                {tag}
              </Link>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link
              href="/market"
              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Browse all tags
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Stay Ahead of the Curve
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get exclusive insights, featured creator spotlights, and the latest trends in digital services. 
              Join 10,000+ professionals who trust FomKart for industry updates.
            </p>
          </div>
          
          <HomeLeadCapture
            title="Join the FomKart Community"
            subtitle="Weekly insights • Exclusive deals • Creator spotlights • Industry trends"
            placeholder="Enter your email address"
            buttonText="Join the Community"
            showNameField={true}
            showPreferences={true}
            className="max-w-2xl mx-auto"
            onSubscribe={undefined}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90 px-4">
            Join thousands of creators and businesses already using FomKart
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 px-4">
            <Link 
              href="/category/digital-products" 
              className="bg-emerald-600 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-center"
            >
              Find Services
            </Link>
            <StartSellingButton />
          </div>
        </div>
      </section>
    </div>
  )
}
