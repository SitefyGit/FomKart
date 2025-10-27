'use client'
import React, { useState } from 'react'
import { Send, Mail, Users, Tag, Eye, Bold, Italic, Link as LinkIcon, Image } from 'lucide-react'
import NewsletterService from '../lib/newsletter/NewsletterService'

interface NewsletterComposerProps {
  creatorId: string
  className?: string
  onSent?: (result: { success: boolean; sent?: number; error?: string }) => void
}

interface NewsletterDraft {
  subject: string
  content: string
  targetPreferences: string[]
  previewMode: boolean
}

const PREFERENCE_OPTIONS = [
  { id: 'digital-marketing', label: 'Digital Marketing Tips' },
  { id: 'product-updates', label: 'Product Updates' },
  { id: 'exclusive-offers', label: 'Exclusive Offers' },
  { id: 'tutorials', label: 'Tutorials & Guides' },
  { id: 'industry-news', label: 'Industry News' },
  { id: 'case-studies', label: 'Case Studies' },
]

export function NewsletterComposer({ creatorId, className = '', onSent }: NewsletterComposerProps) {
  const [draft, setDraft] = useState<NewsletterDraft>({
    subject: '',
    content: '',
    targetPreferences: [],
    previewMode: false
  })
  const [isSending, setIsSending] = useState(false)
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)

  const handlePreferenceToggle = (preferenceId: string) => {
    setDraft(prev => ({
      ...prev,
      targetPreferences: prev.targetPreferences.includes(preferenceId)
        ? prev.targetPreferences.filter(id => id !== preferenceId)
        : [...prev.targetPreferences, preferenceId]
    }))
  }

  const handleSend = async () => {
    if (!draft.subject.trim() || !draft.content.trim()) {
      alert('Please fill in both subject and content before sending.')
      return
    }

    setIsSending(true)
    
    try {
      const result = await NewsletterService.sendNewsletter(
        creatorId,
        draft.subject.trim(),
        draft.content.trim(),
        draft.targetPreferences.length > 0 ? draft.targetPreferences : undefined
      )
      
      if (onSent) {
        onSent(result)
      }
      
      if (result.success) {
        // Reset form on success
        setDraft({
          subject: '',
          content: '',
          targetPreferences: [],
          previewMode: false
        })
        
        // Show success message
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        notification.innerHTML = `
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span>Newsletter sent to ${result.sent} subscribers! 📧</span>
          </div>
        `
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 5000)
      } else {
        alert(`Failed to send newsletter: ${result.error}`)
      }
    } catch (error) {
      console.error('Send error:', error)
      alert('An unexpected error occurred while sending the newsletter.')
    } finally {
      setIsSending(false)
    }
  }

  // Load subscriber count when preferences change
  React.useEffect(() => {
    const loadSubscriberCount = async () => {
      try {
        const { success, subscribers } = await NewsletterService.getSubscribers(creatorId, 'active')
        if (success && subscribers) {
          const filteredCount = draft.targetPreferences.length > 0
            ? subscribers.filter(sub => 
                sub.preferences?.interests?.some(interest => 
                  draft.targetPreferences.includes(interest)
                )
              ).length
            : subscribers.length
          setSubscriberCount(filteredCount)
        }
      } catch (error) {
        console.error('Error loading subscriber count:', error)
      }
    }
    
    loadSubscriberCount()
  }, [creatorId, draft.targetPreferences])

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Send className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Newsletter Composer</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create and send newsletters to your subscribers
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Tag className="inline h-4 w-4 mr-1" />
            Target Audience {subscriberCount !== null && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ({subscriberCount} recipients)
              </span>
            )}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PREFERENCE_OPTIONS.map((option) => (
              <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.targetPreferences.includes(option.id)}
                  onChange={() => handlePreferenceToggle(option.id)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Leave all unchecked to send to all active subscribers
          </p>
        </div>

        {/* Subject Line */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subject Line
          </label>
          <input
            type="text"
            id="subject"
            value={draft.subject}
            onChange={(e) => setDraft(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Enter your newsletter subject..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Newsletter Content
            </label>
            <button
              type="button"
              onClick={() => setDraft(prev => ({ ...prev, previewMode: !prev.previewMode }))}
              className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <Eye className="h-4 w-4" />
              <span>{draft.previewMode ? 'Edit' : 'Preview'}</span>
            </button>
          </div>
          
          {draft.previewMode ? (
            <div className="min-h-48 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="prose dark:prose-invert max-w-none">
                <h3>{draft.subject || 'Newsletter Subject'}</h3>
                <div className="whitespace-pre-wrap">{draft.content || 'Newsletter content will appear here...'}</div>
              </div>
            </div>
          ) : (
            <textarea
              id="content"
              value={draft.content}
              onChange={(e) => setDraft(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your newsletter content here...

Hi there!

Thanks for subscribing to my newsletter. Here's what I've been working on lately...

Best regards,
[Your Name]"
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {subscriberCount !== null && (
              <span>Ready to send to {subscriberCount} subscribers</span>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setDraft(prev => ({ ...prev, previewMode: !prev.previewMode }))}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Eye className="h-4 w-4 inline mr-1" />
              Preview
            </button>
            
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || !draft.subject.trim() || !draft.content.trim()}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Newsletter</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewsletterComposer
