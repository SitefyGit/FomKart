import React from 'react'
import Link from 'next/link'
import { User, LogIn, Share2, TrendingUp } from 'lucide-react'

export function QuickNavigation() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border p-4 min-w-[200px]">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Quick Access</h3>
        <div className="space-y-2">
          <Link
            href="/creator/designpro"
            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg text-sm transition-colors"
          >
            <User className="h-4 w-4 text-emerald-600" />
            <span>Creator Profile</span>
          </Link>
          
          <Link
            href="/auth/login"
            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg text-sm transition-colors"
          >
            <LogIn className="h-4 w-4 text-blue-600" />
            <span>Creator Login</span>
          </Link>
          
          <div className="border-t border-gray-200 my-2"></div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Demo Credentials Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <Share2 className="h-3 w-3" />
              <span>Share Features Enabled</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-3 w-3" />
              <span>Growth Hack Tools Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
