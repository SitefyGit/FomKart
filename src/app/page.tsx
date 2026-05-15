import React from 'react'
import Link from 'next/link'
import { TrendingUp, ArrowRight, ShieldCheck, BadgeCheck, Box, GraduationCap, Video, Zap, CheckCircle } from 'lucide-react'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { HomeLeadCapture } from './HomeClientWidgets'
import TopCreatorsSection from '@/app/top-creators'
import FeaturedServicesSection from '@/app/featured-services'
import StartSellingButton from '@/components/StartSellingButton'
import { TranslatableText } from '@/components/TranslatableText'
import { RevealObserver } from '@/components/RevealObserver'

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
    description: 'Services and consulting',
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
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-[#0a0a0f] text-[#0c0a09] dark:text-gray-100 font-sans relative overflow-hidden">
      <RevealObserver />

      {/* Ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-emerald-100/60 dark:bg-emerald-900/30 -top-[15%] -left-[10%]"></div>
        <div className="orb w-[400px] h-[400px] bg-amber-100/50 dark:bg-amber-900/20 bottom-[5%] -right-[5%]" style={{ animationDelay: '-5s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,#FDFCF8_100%)] dark:bg-[linear-gradient(to_bottom,transparent_0%,#0a0a0f_100%)]"></div>
      </div>

      <main className="relative z-10">

        {/* HERO: Editorial, left-aligned, massive type */}
        <section className="min-h-screen flex flex-col justify-center px-6 lg:px-20 pt-24 pb-20 max-w-[1600px] mx-auto">
          
          {/* Eyebrow */}
          <div className="reveal mb-10">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-stone-100 dark:bg-gray-800/80 border border-stone-200 dark:border-gray-700 text-stone-600 dark:text-gray-300 text-sm font-medium tracking-wide">
              <TranslatableText text="Welcome to the Future of marketplace" />
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">(Fomkart)</span>
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-black tracking-tighter leading-[0.92] mb-12">
            <div className="mask-reveal">
              <span className="text-[clamp(3.2rem,11vw,10rem)] text-[#0c0a09] dark:text-white"><TranslatableText text="Buy anything digital." /></span>
            </div>
            <div className="mask-reveal delay-100">
              <span className="text-[clamp(3.2rem,11vw,10rem)] text-emerald-700 dark:text-emerald-400 lg:pl-40"><TranslatableText text="Sell anything digital." /></span>
            </div>
          </h1>

          {/* Subhead */}
          <div className="reveal delay-200 max-w-xl lg:pl-40">
            <TranslatableText as="p" className="text-lg lg:text-2xl text-stone-500 dark:text-gray-400 leading-relaxed" text="Discover, buy, and sell digital products, services, and consultations — all in one place. Built for anyone, anywhere." />
          </div>
        </section>

        {/* BENTO BUY / SELL */}
        <section className="px-6 lg:px-20 pb-32 max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-[minmax(380px,auto)]">

            {/* BUY: Large, soft emerald, left */}
            <div className="lg:col-span-7 lg:row-span-2 relative bg-[#ecfdf5] dark:bg-emerald-950/40 rounded-[2.5rem] p-10 lg:p-14 border border-emerald-100/60 dark:border-emerald-800/30 overflow-hidden group hover:shadow-[0_24px_60px_-12px_rgba(16,185,129,0.15)] dark:hover:shadow-[0_24px_60px_-12px_rgba(16,185,129,0.05)] transition-all duration-700 reveal">
              {/* Decorative glow */}
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-300/40 dark:bg-emerald-500/10 rounded-full blur-[90px] group-hover:bg-emerald-300/50 dark:group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-500">
                    <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                    </svg>
                  </div>
                  <TranslatableText as="h2" className="text-4xl lg:text-5xl font-bold text-emerald-950 dark:text-emerald-100 mb-4 tracking-tight" text="Buy" />
                  <TranslatableText as="p" className="text-emerald-900/70 dark:text-emerald-200/70 text-lg lg:text-xl max-w-md leading-relaxed" text="Explore anything digital — from tools and courses to expert services — and get things done faster." />
                </div>

                <div className="mt-10">
                  <ul className="space-y-3 mb-10">
                    <li className="flex items-center gap-3 text-emerald-900 dark:text-emerald-100 font-semibold text-lg">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs shrink-0">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </span>
                      <TranslatableText text="Courses, tools & digital products" />
                    </li>
                    <li className="flex items-center gap-3 text-emerald-900 dark:text-emerald-100 font-semibold text-lg">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs shrink-0">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </span>
                      <TranslatableText text="Hire experts & services instantly" />
                    </li>
                    <li className="flex items-center gap-3 text-emerald-900 dark:text-emerald-100 font-semibold text-lg">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs shrink-0">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </span>
                      <TranslatableText text="Learn, build, or grow anything" />
                    </li>
                  </ul>
                  <Link href="/market" className="inline-flex items-center gap-3 px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full font-bold transition-all duration-300 hover:shadow-lg hover:shadow-emerald-700/25 hover:-translate-y-0.5">
                    <TranslatableText text="Browse Marketplace" />
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* SELL: Dark, contrasting, right */}
            <div className="lg:col-span-5 lg:row-span-2 relative bg-[#0c0a09] dark:bg-[#1a1a24] rounded-[2.5rem] p-10 lg:p-14 text-white overflow-hidden group hover:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] transition-all duration-700 reveal delay-100">
              {/* Subtle pattern */}
              <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent"></div>

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm group-hover:bg-white/15 transition-colors duration-500">
                    <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <TranslatableText as="h2" className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight" text="Sell" />
                  <TranslatableText as="p" className="text-stone-400 text-lg lg:text-xl max-w-sm leading-relaxed" text="Turn your knowledge, skills, or products into income. Launch your digital business in minutes." />
                </div>

                <div className="mt-10">
                  <ul className="space-y-3 mb-10">
                    <li className="flex items-center gap-3 text-stone-300 font-medium text-lg">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                      <TranslatableText text="Sell products, services & consultations" />
                    </li>
                    <li className="flex items-center gap-3 text-stone-300 font-medium text-lg">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                      <TranslatableText text="Free link-in-bio storefront" />
                    </li>
                    <li className="flex items-center gap-3 text-stone-300 font-medium text-lg">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                      <TranslatableText text="Launch fast & sell globally" />
                    </li>
                  </ul>
                  <Link href="/auth/creator-signup" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-amber-50 rounded-full font-bold transition-all duration-300 hover:-translate-y-0.5">
                    <TranslatableText text="Start Selling" />
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* CATEGORIES: Staggered editorial grid */}
        <section className="bg-[#f0fdf4] dark:bg-[#06140f] py-32 lg:py-40 px-6 lg:px-20">
          <div className="max-w-[1600px] mx-auto">
            
            {/* Section header */}
            <div className="text-center mb-24 reveal">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold tracking-widest uppercase mb-8">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                </svg>
                <TranslatableText text="Curated for quality" />
              </div>
              <TranslatableText as="h2" className="text-5xl lg:text-8xl font-black tracking-tight text-emerald-950 dark:text-emerald-50 mb-6" text="Explore our categories" />
              <TranslatableText as="p" className="text-stone-500 dark:text-gray-400 text-xl lg:text-2xl" text="Discover the perfect offering for your needs" />
            </div>

            {/* Cards: staggered rhythm */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">

              {/* Digital Products */}
              <Link href="/category/digital-products" className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 border border-stone-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500/50 hover:shadow-[0_20px_50px_-12px_rgba(59,130,246,0.12)] transition-all duration-500 group reveal">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-7 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
                <TranslatableText as="h3" className="text-2xl font-bold text-stone-900 dark:text-white mb-2 tracking-tight" text="Digital Products" />
                <TranslatableText as="p" className="text-stone-500 dark:text-gray-400 leading-relaxed mb-8" text="Templates, graphics, and digital assets" />
                <div className="flex items-center justify-between pt-6 border-t border-stone-100 dark:border-gray-700">
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">2,847 offerings</span>
                  <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-300 group-hover:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </Link>

              {/* Online Courses (offset down) */}
              <Link href="/category/courses" className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 border border-stone-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-500/50 hover:shadow-[0_20px_50px_-12px_rgba(147,51,234,0.12)] transition-all duration-500 group reveal delay-100 lg:mt-16">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-7 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                  </svg>
                </div>
                <TranslatableText as="h3" className="text-2xl font-bold text-stone-900 dark:text-white mb-2 tracking-tight" text="Online Courses" />
                <TranslatableText as="p" className="text-stone-500 dark:text-gray-400 leading-relaxed mb-8" text="Learn new skills and advance your career" />
                <div className="flex items-center justify-between pt-6 border-t border-stone-100 dark:border-gray-700">
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">1,293 courses</span>
                  <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-300 group-hover:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </Link>

              {/* Consultations */}
              <Link href="/category/consultation" className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 border border-stone-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:shadow-[0_20px_50px_-12px_rgba(99,102,241,0.12)] transition-all duration-500 group reveal delay-200">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-7 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                </div>
                <TranslatableText as="h3" className="text-2xl font-bold text-stone-900 dark:text-white mb-2 tracking-tight" text="Consultations" />
                <TranslatableText as="p" className="text-stone-500 dark:text-gray-400 leading-relaxed mb-8" text="Expert advice and 1-on-1 coaching" />
                <div className="flex items-center justify-between pt-6 border-t border-stone-100 dark:border-gray-700">
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">884 sessions</span>
                  <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-300 group-hover:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </Link>

              {/* Custom Services (offset down) */}
              <Link href="/category/services" className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 border border-stone-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-500/50 hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.12)] transition-all duration-500 group reveal delay-300 lg:mt-16">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-7 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <TranslatableText as="h3" className="text-2xl font-bold text-stone-900 dark:text-white mb-2 tracking-tight" text="Custom Services" />
                <TranslatableText as="p" className="text-stone-500 dark:text-gray-400 leading-relaxed mb-8" text="Services and consulting" />
                <div className="flex items-center justify-between pt-6 border-t border-stone-100 dark:border-gray-700">
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">4,156 services</span>
                  <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-300 group-hover:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </Link>

            </div>
          </div>
        </section>
      </main>

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
              Join 10,000+ professionals who trust fomkart for industry updates.
            </p>
          </div>
          
          <HomeLeadCapture
            title="Join the fomkart Community"
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
            Join thousands of creators and businesses already using fomkart
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








