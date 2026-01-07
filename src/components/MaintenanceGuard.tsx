'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePathname } from 'next/navigation'
import { Wrench } from 'lucide-react'

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    checkMaintenanceStatus()
  }, [pathname])

  const checkMaintenanceStatus = async () => {
    try {
      // 1. Check if maintenance mode is on
      const { data: settings } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single()

      const maintenanceMode = settings?.value === 'true'
      setIsMaintenance(maintenanceMode)

      if (maintenanceMode) {
        // 2. If on, check if user is admin
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: adminUser } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', user.id)
            .single()
          
          setIsAdmin(!!adminUser)
        }
      }
    } catch (error) {
      console.error('Failed to check maintenance status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Allow access to admin routes even in maintenance mode
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth/login')) {
    return <>{children}</>
  }

  if (loading) {
    return <>{children}</> // Show content while checking to avoid flash
  }

  if (isMaintenance && !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Under Maintenance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We are currently performing scheduled maintenance to improve our platform. We'll be back shortly.
          </p>
          <div className="text-sm text-gray-500">
            Thank you for your patience.
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
