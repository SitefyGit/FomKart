'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import NewsletterService from '../../lib/newsletter/NewsletterService'

export default function UnsubscribePage() {
  const [email, setEmail] = useState('')
  const [creatorId, setCreatorId] = useState('')
  const [isUnsubscribing, setIsUnsubscribing] = useState(false)
  const [status, setStatus] = useState<{
    type: 'idle' | 'success' | 'error'
    message: string
  }>({ type: 'idle', message: '' })

  // Parse URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get('email')
    const creatorParam = urlParams.get('creator')
    
    if (emailParam) setEmail(decodeURIComponent(emailParam))
    if (creatorParam) setCreatorId(decodeURIComponent(creatorParam))
  }, [])

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !creatorId) {
      setStatus({
        type: 'error',
        message: 'Email and creator information are required'
      })
      return
    }

    setIsUnsubscribing(true)
    setStatus({ type: 'idle', message: '' })

    try {
      const result = await NewsletterService.unsubscribe(email, creatorId)
      
      if (result.success) {
        setStatus({
          type: 'success',
          message: 'You have been successfully unsubscribed from this newsletter.'
        })
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Failed to unsubscribe. Please try again.'
        })
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.'
      })
    } finally {
      setIsUnsubscribing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to FomKart</span>
          </Link>
          
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <Mail className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unsubscribe</h1>
          <p className="text-gray-600 dark:text-gray-300">
            We're sorry to see you go. You can unsubscribe from newsletters below.
          </p>
        </div>

        {/* Unsubscribe Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
          {status.type === 'success' ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unsubscribed Successfully</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{status.message}</p>
              <Link 
                href="/"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                <span>Return to FomKart</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleUnsubscribe} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isUnsubscribing}
                />
              </div>

              <div>
                <label htmlFor="creatorId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Creator ID
                </label>
                <input
                  type="text"
                  id="creatorId"
                  value={creatorId}
                  onChange={(e) => setCreatorId(e.target.value)}
                  placeholder="Creator's username or ID"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isUnsubscribing}
                />
              </div>

              {status.type === 'error' && (
                <div className="flex items-center space-x-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-700 dark:text-red-300">{status.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isUnsubscribing || !email || !creatorId}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isUnsubscribing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Unsubscribing...</span>
                  </>
                ) : (
                  <span>Unsubscribe</span>
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                You will stop receiving newsletters from this creator immediately.
              </p>
            </form>
          )}
        </div>

        {/* Feedback Section */}
        {status.type !== 'success' && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Help us improve
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              We'd love to know why you're unsubscribing (optional):
            </p>
            <div className="space-y-2">
              {[
                'Too many emails',
                'Content not relevant',
                'Never signed up',
                'Technical issues',
                'Other reason'
              ].map((reason) => (
                <label key={reason} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{reason}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
