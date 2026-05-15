'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Briefcase } from 'lucide-react'

export default function CreatorSignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Create profile via server API using service role (bypasses RLS issues during first signup)
        const generatedUsername = formData.email.split('@')[0] + Math.floor(Math.random() * 10000).toString()
        const res = await fetch('/api/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.user.id,
            email: formData.email,
            username: generatedUsername,
            full_name: '',
            bio: '',
            website: '',
            is_creator: true,
            is_verified: false,
          }),
        })

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}))
          console.error('Error creating creator profile:', payload)
          setError(payload?.error || 'Failed to create creator profile')
          setLoading(false)
          return
        }

        setLoading(false)
        alert('Creator account created successfully! Please check your email to confirm your account.')
        router.push('/auth/login')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      setError(message)
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault()
    if (window.history.length > 2) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center mr-3">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Join as Creator</h2>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Start selling your products and services</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Creator Benefits */}
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Creator Benefits:</h3>
          <ul className="text-sm text-emerald-700 dark:text-emerald-400 space-y-1">
            <li>• Create your own storefront</li>
            <li>• Sell digital products & services</li>
            <li>• Build your subscriber list</li>
            <li>• Track sales and analytics</li>
          </ul>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 dark:text-white placeholder-gray-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 dark:text-white placeholder-gray-500 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating Creator Account...' : 'Create Creator Account'}
            </button>
          </form>
        </div>

        {/* Sign In Links */}
        <div className="text-center space-y-2">
          <p className="text-gray-600 dark:text-gray-400">
            Already have a creator account?{' '}
            <Link
              href="/auth/login"
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
            >
              Sign in here
            </Link>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Want to buy instead?{' '}
            <Link
              href="/auth/signup"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Create buyer account
            </Link>
          </p>
        </div>

        {/* Terms Notice */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            By creating a creator account, you agree to our{' '}
            <Link href="/terms" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
              Creator Terms
            </Link>,{' '}
            <Link href="/terms" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
