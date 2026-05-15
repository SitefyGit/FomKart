'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function SignUpContent() {
  const [showPassword, setShowPassword] = useState(false)
  const [registrationDisabled, setRegistrationDisabled] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/'

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        window.location.href = redirectUrl
      }
    })
    checkRegistrationStatus()
  }, [redirectUrl])

  const checkRegistrationStatus = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'enable_registration')
        .single()
      
      if (data?.value === 'false') {
        setRegistrationDisabled(true)
      }
    } catch (err) {
      console.error('Failed to check registration status', err)
    } finally {
      setCheckingStatus(false)
    }
  }

  if (checkingStatus) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  }

  if (registrationDisabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Registration Closed</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            New user registration is currently disabled. Please check back later or contact support if you believe this is an error.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    )
  }

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
        // Wait a moment for the auth session to be established
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Create user profile
        const generatedUsername = formData.email.split('@')[0] + Math.floor(Math.random() * 10000).toString()
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: formData.email,
            username: generatedUsername,
            full_name: '',
            is_creator: false
          }])

        if (profileError) {
          console.error('Error creating user profile:', profileError)
          
          // Try to provide more specific error messages
          if (profileError.code === '23505') {
            setError('Username already exists. Please choose a different username.')
          } else if (profileError.message.includes('row-level security')) {
            setError('Database permission error. Please contact support or check your database setup.')
          } else {
            console.warn('Profile creation failed, but user account was created:', profileError.message)
            // Don't fail completely if profile creation fails - the user can still log in
          }
        }

        setLoading(false)
        
        if (data.session) {
          // Immediately signed in
          window.location.href = redirectUrl
        } else {
          // Show success message or redirect to confirmation page
          alert('Account created successfully! Please check your email to confirm your account.')
          router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      setError(message)
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      router.push(redirectUrl)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Join fomkart and start your journey</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

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
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 transition-colors"
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
                  className="w-full pl-10 pr-12 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 transition-colors"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              href={redirectUrl !== '/' ? `/auth/login?redirect=${encodeURIComponent(redirectUrl)}` : "/auth/login"}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Terms Notice */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignUpContent />
    </Suspense>
  )
}
