"use client"

import React from 'react'
import { ExternalLink, Copy, Mail, Facebook, Linkedin, MessageCircle, Flag } from 'lucide-react'

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string; // legacy for creator profile
  url?: string; // explicit URL to share (product or custom)
  title?: string; // display title context
}

export function ShareModal({ isOpen, onClose, username, url, title }: ShareModalProps) {
  if (!isOpen) return null

  const shareLink = url || (username ? `https://fomkart.com/creator/${username}` : (typeof window !== 'undefined' ? window.location.href : ''))

  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareLink)
      return
    }
    if (typeof window !== 'undefined') {
      window.prompt('Copy this link', shareLink)
    }
  }

  const encodedLink = encodeURIComponent(shareLink)
  const encodedTitle = encodeURIComponent(title || `Check this on FomKart`)

  const shareActions = [
    {
      name: 'Share on Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`
    },
    {
      name: 'Share on LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedLink}&title=${encodedTitle}`
    },
    {
      name: 'Share via WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600',
      href: `https://wa.me/?text=${encodeURIComponent(`${title ? `${title} – ` : ''}${shareLink}`)}`
    },
    {
      name: 'Share via Email',
      icon: Mail,
      color: 'text-gray-600',
      href: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`Thought you might like this: ${shareLink}`)}`
    }
  ] as const
  const heading = title ? `Share ${title}` : (username ? `Share @${username}'s Profile` : 'Share')

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[1.5px] flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-96 max-w-90vw border border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{heading}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white text-sm">F</div>
            <span className="flex-1 font-medium truncate text-gray-900 dark:text-white">{shareLink.replace(/^https?:\/\//,'')}</span>
            <button 
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-400"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          
          {shareActions.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors text-gray-700 dark:text-gray-200"
            >
              <social.icon className={`h-5 w-5 ${social.color}`} />
              <span>{social.name}</span>
              <ExternalLink className="h-4 w-4 text-gray-400 dark:text-gray-500 ml-auto" />
            </a>
          ))}

          <a
            href={`mailto:support@fomkart.com?subject=${encodeURIComponent('Report page on FomKart')}&body=${encodeURIComponent(`I would like to report this page: ${shareLink}`)}`}
            className="w-full flex items-center space-x-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400 mt-2"
          >
            <Flag className="h-5 w-5" />
            <span>Report page</span>
          </a>
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white text-sm">F</div>
            <span className="font-medium text-gray-900 dark:text-white">Create your own creator profile on FomKart!</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Join thousands of creators today.</p>
          <div className="flex space-x-3">
            <a href="/auth/creator-signup" className="flex-1 text-center bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
              Sign up
            </a>
            <a href="/creator-login" className="flex-1 text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Learn more
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
