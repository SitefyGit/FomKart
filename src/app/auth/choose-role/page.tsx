'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ShoppingBag, Store, ChevronRight } from 'lucide-react'

function ChooseRoleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/'

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault()
    if (window.history.length > 2) {
      router.back()
    } else {
      router.push(redirectUrl)
    }
  }

  const redirectQuery = redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Join fomkart</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Choose how you want to use the platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Buyer Card */}
          <Link 
            href={`/auth/signup${redirectQuery}`}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-xl border-2 border-transparent hover:border-emerald-500 transition-all duration-300 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Sign up as Buyer</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 flex-grow">
              Purchase digital products, enroll in online courses, book services, and schedule consultations from top creators.
            </p>
            <div className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium group-hover:gap-2 transition-all">
              Join as Buyer <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          {/* Creator Card */}
          <Link 
            href="/auth/creator-signup"
            className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm hover:shadow-xl border-2 border-transparent hover:border-emerald-500 transition-all duration-300 flex flex-col items-center text-center"
          >
            <div className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-1 rounded-full">
              Popular
            </div>
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Store className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Sign up as Creator</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 flex-grow">
              Start your own store. Sell digital products, create courses, offer services, and monetize your expertise.
            </p>
            <div className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium group-hover:gap-2 transition-all">
              Start Selling <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href={`/auth/login${redirectQuery}`}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ChooseRolePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ChooseRoleContent />
    </Suspense>
  )
}
