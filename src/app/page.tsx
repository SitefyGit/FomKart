import React from 'react'
import Link from 'next/link'
import { TrendingUp, ArrowRight, ShieldCheck, BadgeCheck, Box, GraduationCap, Video, Zap, CheckCircle } from 'lucide-react'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { HomeLeadCapture } from './HomeClientWidgets'
import TopCreatorsSection from '@/app/top-creators'
import FeaturedServicesSection from '@/app/featured-services'
import StartSellingButton from '@/components/StartSellingButton'
import { TranslatableText } from '@/components/TranslatableText'

const featuredCategories = [
  {
    name: 'Digital Products',
    slug: 'digital-products',
    icon: Box,
    description: 'Templates, graphics, and digital assets',
    gradient: 'from-blue-500 to-cyan-400',
    shadow: 'shadow-blue-500/30',
    count: '2,847 offerings'
  },
  {
    name: 'Online Courses',
    slug: 'courses',
    icon: GraduationCap,
    description: 'Learn new skills and advance your career',
    gradient: 'from-purple-500 to-pink-400',
    shadow: 'shadow-purple-500/30',
    count: '1,293 courses'
  },
  {
    name: 'Consultations',
    slug: 'consultation',
    icon: Video,
    description: 'Expert advice and 1-on-1 coaching',
    gradient: 'from-indigo-500 to-blue-400',
    shadow: 'shadow-indigo-500/30',
    count: '894 sessions'
  },
  {
    name: 'Custom Services',
    slug: 'services',
    icon: Zap,
    description: 'Professional services and consulting',
    gradient: 'from-emerald-500 to-teal-400',
    shadow: 'shadow-emerald-500/30',
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
      <section className="relative overflow-hidden pt-28 pb-24 sm:pt-40 sm:pb-32 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-center font-sans">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100 via-transparent to-transparent dark:from-emerald-900/30 dark:via-transparent dark:to-transparent"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-200/40 dark:bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '8s'}}></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-200/40 dark:bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '10s', animationDelay: '2s'}}></div>
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* WELCOME LINE */}
          <h2 className="text-[clamp(20px,2.5vw,28px)] font-medium text-gray-800 dark:text-gray-300 mb-3">
            <TranslatableText text="Welcome to the Future of marketplace" /> (<strong className="font-extrabold text-emerald-600 dark:text-emerald-400">F<span className="font-black">o</span>m</strong>kart)
          </h2>

          {/* MAIN HEADLINE */}
          <h1 className="text-[clamp(42px,6vw,76px)] font-black text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">
            <TranslatableText text="Buy anything digital." />
            <span className="block text-emerald-600 dark:text-emerald-400"><TranslatableText text="Sell anything digital." /></span>
          </h1>

          {/* SUBTEXT */}
          <TranslatableText as="p" className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed" text="Discover, buy, and sell digital products, services, and consultations — all in one place. Built for anyone, anywhere." />

          {/* 2 COLUMN GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">

            {/* BUYER */}
            <div className="bg-white/80 dark:bg-gray-800/90 p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-emerald-100 dark:border-gray-700 transition-transform duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-gray-200/60 dark:hover:border-emerald-500/30 group">
              <TranslatableText as="h3" className="text-2xl font-bold mb-3 text-gray-900 dark:text-white" text="Buy" />
              <TranslatableText as="p" className="text-base text-gray-600 dark:text-gray-300 mb-6" text="Explore anything digital — from tools and courses to expert services — and get things done faster." />

              <ul className="pl-5 mb-8 space-y-3">
                <li className="text-gray-700 dark:text-emerald-100 font-medium list-disc marker:text-emerald-500"><TranslatableText text="Courses, tools & digital products" /></li>
                <li className="text-gray-700 dark:text-emerald-100 font-medium list-disc marker:text-emerald-500"><TranslatableText text="Hire experts & services instantly" /></li>
                <li className="text-gray-700 dark:text-emerald-100 font-medium list-disc marker:text-emerald-500"><TranslatableText text="Learn, build, or grow anything" /></li>
              </ul>

              <Link href="/market" className="inline-block px-7 py-4 rounded-xl font-bold text-base text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 transition-all">
                <TranslatableText text="Browse Marketplace" />
              </Link>
            </div>

            {/* SELLER */}
            <div className="bg-white/80 dark:bg-gray-800/90 p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-indigo-100 dark:border-gray-700 transition-transform duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-gray-200/60 dark:hover:border-indigo-500/30 group">
              <TranslatableText as="h3" className="text-2xl font-bold mb-3 text-gray-900 dark:text-white" text="Sell" />
              <TranslatableText as="p" className="text-base text-gray-600 dark:text-gray-300 mb-6" text="Turn your knowledge, skills, or products into income. Launch your digital business in minutes." />

              <ul className="pl-5 mb-8 space-y-3">
                <li className="text-gray-700 dark:text-indigo-100 font-medium list-disc marker:text-indigo-500"><TranslatableText text="Sell products, services & consultations" /></li>
                <li className="text-gray-700 dark:text-indigo-100 font-medium list-disc marker:text-indigo-500"><TranslatableText text="Free link-in-bio storefront" /></li>
                <li className="text-gray-700 dark:text-indigo-100 font-medium list-disc marker:text-indigo-500"><TranslatableText text="Launch fast & sell globally" /></li>
              </ul>

              <Link href="/creator/onboarding" className="inline-block px-7 py-4 rounded-xl font-bold text-base text-gray-800 dark:text-white bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 shadow-sm transition-all">
                <TranslatableText text="Start Selling" />
              </Link>
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
                  <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${category.gradient} opacity-5 dark:opacity-10 rounded-full transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700 blur-2xl`}></div>
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${category.gradient} rounded-2xl flex items-center justify-center mb-5 sm:mb-6 group-hover:-translate-y-1 group-hover:rotate-3 transition-all duration-300 relative z-10 shadow-lg ${category.shadow}`}>
                    <category.icon className="h-7 w-7 sm:h-8 sm:w-8 text-white drop-shadow-md" strokeWidth={2} />
                  </div>
                  <TranslatableText as="h3" text={category.name} className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 transition-colors duration-300 relative z-20" />
                  <TranslatableText text={category.description} className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors relative z-20" showListingControls />        
                  <div className="flex items-center justify-between relative z-20">
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full inline-flex items-center gap-1 font-medium">
                      <TrendingUp className="w-3 h-3 text-emerald-500" /> {category.count}
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
                <TranslatableText as="div" text="Verified creators" className="text-sm font-semibold text-gray-900 dark:text-white" />
                <TranslatableText text="Handpicked quality profiles" className="text-xs text-gray-500 dark:text-gray-400" showListingControls />
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <TranslatableText as="div" text="Secure payments" className="text-sm font-semibold text-gray-900 dark:text-white" />
                <TranslatableText text="Protected checkout flow" className="text-xs text-gray-500 dark:text-gray-400" showListingControls />
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <TranslatableText as="div" text="Satisfaction focus" className="text-sm font-semibold text-gray-900 dark:text-white" />
                <TranslatableText text="Clear deliverables, refund policy" className="text-xs text-gray-500 dark:text-gray-400" showListingControls />
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
            <TranslatableText as="h2" text="Popular Offerings" className="text-2xl font-bold text-gray-900 dark:text-white mb-2" />
            <TranslatableText text="Explore trending categories and find exactly what you need" className="text-gray-600 dark:text-gray-400" showListingControls />
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
            subtitle="Weekly insights � Exclusive deals � Creator spotlights � Industry trends"
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
      <section className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white py-12 sm:py-16 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-12 sm:pt-16 -mt-12 sm:-mt-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90 px-4">
            Join thousands of creators and businesses already using FomKart
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 px-4">
            <Link
              href="/category/digital-products"
              className="bg-emerald-600 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-center inline-flex items-center justify-center whitespace-nowrap"
            >
              Find Offerings
            </Link>
            <StartSellingButton isCTA />
          </div>
        </div>
      </section>
    </div>
  )
}








