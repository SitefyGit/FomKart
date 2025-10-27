'use client'
import React, { useState } from 'react'
import { Mail, User, Tag, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface LeadCaptureFormProps {
  creatorId?: string
  className?: string
  title?: string
  subtitle?: string
  placeholder?: string
  buttonText?: string
  showNameField?: boolean
  showPreferences?: boolean
  compactMode?: boolean
  onSubscribe?: (data: SubscriptionData) => void
}

interface SubscriptionData {
  email: string
  name?: string
  preferences?: string[]
  source: string
}

interface FormState {
  email: string
  name: string
  preferences: string[]
  isSubmitting: boolean
  message: string
  messageType: 'success' | 'error' | null
}

const PREFERENCE_OPTIONS = [
  { id: 'digital-marketing', label: 'Digital Marketing Tips' },
  { id: 'product-updates', label: 'Product Updates' },
  { id: 'exclusive-offers', label: 'Exclusive Offers' },
  { id: 'tutorials', label: 'Tutorials & Guides' },
  { id: 'industry-news', label: 'Industry News' },
  { id: 'case-studies', label: 'Case Studies' },
]

export function LeadCaptureForm({
  creatorId,
  className = '',
  title = 'Stay Updated!',
  subtitle = 'Get personalized newsletters tailored to your interests',
  placeholder = 'Enter your email address',
  buttonText = 'Subscribe Now',
  showNameField = true,
  showPreferences = true,
  compactMode = false,
  onSubscribe
}: LeadCaptureFormProps) {
  const [formState, setFormState] = useState<FormState>({
    email: '',
    name: '',
    preferences: [],
    isSubmitting: false,
    message: '',
    messageType: null
  })

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handlePreferenceToggle = (preferenceId: string) => {
    setFormState(prev => ({
      ...prev,
      preferences: prev.preferences.includes(preferenceId)
        ? prev.preferences.filter(id => id !== preferenceId)
        : [...prev.preferences, preferenceId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateEmail(formState.email)) {
      setFormState(prev => ({
        ...prev,
        message: 'Please enter a valid email address',
        messageType: 'error'
      }))
      return
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, message: '', messageType: null }))

    try {
      const subscriptionData: SubscriptionData = {
        email: formState.email.toLowerCase().trim(),
        name: formState.name.trim() || undefined,
        preferences: formState.preferences.length > 0 ? formState.preferences : undefined,
        source: 'lead_capture_form'
      }

      // Try API route first, fallback to direct Supabase if needed
      try {
        const response = await fetch('/api/newsletter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: subscriptionData.email,
            name: subscriptionData.name,
            creatorId: creatorId,
            preferences: subscriptionData.preferences,
            source: subscriptionData.source
          })
        })

        if (!response.ok) {
          throw new Error('API request failed')
        }

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'API request failed')
        }
      } catch (apiError) {
        console.warn('API route failed, trying direct Supabase:', apiError)
        
        // Fallback to direct Supabase integration
        if (creatorId) {
          const { error } = await supabase
            .from('newsletter_subscriptions')
            .upsert({
              email: subscriptionData.email,
              creator_id: creatorId,
              name: subscriptionData.name,
              preferences: { interests: subscriptionData.preferences },
              source: subscriptionData.source,
              tags: subscriptionData.preferences || [],
              status: 'active'
            }, {
              onConflict: 'email,creator_id'
            })

          if (error) {
            console.error('Supabase error:', error)
            throw new Error(error.message)
          }
        }
      }

      // Call custom callback if provided
      if (onSubscribe) {
        onSubscribe(subscriptionData)
      }

      setFormState(prev => ({
        ...prev,
        email: '',
        name: '',
        preferences: [],
        message: 'Thank you for subscribing! Check your email for confirmation.',
        messageType: 'success',
        isSubmitting: false
      }))

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setFormState(prev => ({ ...prev, message: '', messageType: null }))
      }, 5000)

    } catch (error) {
      console.error('Subscription error:', error)
      setFormState(prev => ({
        ...prev,
        message: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        messageType: 'error',
        isSubmitting: false
      }))

      // Auto-clear error message after 5 seconds
      setTimeout(() => {
        setFormState(prev => ({ ...prev, message: '', messageType: null }))
      }, 5000)
    }
  }

  if (compactMode) {
    return (
      <div className={`bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3 mb-3">
          <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h4>
            <p className="text-xs text-gray-600 dark:text-gray-300">{subtitle}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="email"
              value={formState.email}
              onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
              placeholder={placeholder}
              required
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={formState.isSubmitting}
            />
            <button
              type="submit"
              disabled={formState.isSubmitting || !formState.email}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 
                       text-white text-sm font-medium rounded-md transition-colors
                       disabled:cursor-not-allowed flex items-center space-x-1"
            >
              {formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  <span>Join</span>
                </>
              )}
            </button>
          </div>
          
          {formState.message && (
            <div className={`flex items-center space-x-2 text-xs p-2 rounded ${
              formState.messageType === 'success' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}>
              {formState.messageType === 'success' ? (
                <CheckCircle className="h-3 w-3 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
              )}
              <span>{formState.message}</span>
            </div>
          )}
        </form>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 
                    border border-emerald-200 dark:border-emerald-700 rounded-xl p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-800 
                       rounded-full mb-4">
          <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              id="email"
              value={formState.email}
              onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
              placeholder={placeholder}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={formState.isSubmitting}
            />
          </div>
        </div>

        {/* Name Field */}
        {showNameField && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name (Optional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="name"
                value={formState.name}
                onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                disabled={formState.isSubmitting}
              />
            </div>
          </div>
        )}

        {/* Preferences */}
        {showPreferences && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Tag className="inline h-4 w-4 mr-1" />
              What interests you? (Optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PREFERENCE_OPTIONS.map((option) => (
                <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.preferences.includes(option.id)}
                    onChange={() => handlePreferenceToggle(option.id)}
                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded 
                             focus:ring-emerald-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    disabled={formState.isSubmitting}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Message Display */}
        {formState.message && (
          <div className={`flex items-center space-x-3 p-4 rounded-lg ${
            formState.messageType === 'success' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700'
          }`}>
            {formState.messageType === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{formState.message}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={formState.isSubmitting || !formState.email}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                   text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200
                   flex items-center justify-center space-x-2 text-base"
        >
          {formState.isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Subscribing...</span>
            </>
          ) : (
            <>
              <Mail className="h-5 w-5" />
              <span>{buttonText}</span>
            </>
          )}
        </button>

        {/* Privacy Notice */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          We respect your privacy. Unsubscribe at any time. No spam, ever.
        </p>
      </form>
    </div>
  )
}

export default LeadCaptureForm
