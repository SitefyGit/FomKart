'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Send, Users, BarChart3 } from 'lucide-react'
import NewsletterDashboard from '../../../components/NewsletterDashboard'
import NewsletterComposer from '../../../components/NewsletterComposer'

export default function NewsletterManagementPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'compose' | 'analytics'>('dashboard')
  const creatorId = 'designpro' // In a real app, this would come from auth/session

  const tabs = [
    { id: 'dashboard', label: 'Subscribers', icon: Users },
    { id: 'compose', label: 'Compose', icon: Send },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/creator/designpro"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Profile</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                  <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Newsletter Management</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your email subscribers and campaigns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <NewsletterDashboard 
            creatorId={creatorId}
            className="max-w-6xl mx-auto"
          />
        )}

        {activeTab === 'compose' && (
          <NewsletterComposer 
            creatorId={creatorId}
            className="max-w-4xl mx-auto"
            onSent={(result) => {
              if (result.success) {
                // Refresh dashboard data
                setActiveTab('dashboard')
              }
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-8 text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Analytics Dashboard
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Detailed analytics and insights coming soon! This will include:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Engagement Metrics</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Open rates and click-through rates</li>
                    <li>• Subscriber growth over time</li>
                    <li>• Most popular content topics</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Audience Insights</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Geographic distribution</li>
                    <li>• Preference breakdowns</li>
                    <li>• Optimal send times</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
