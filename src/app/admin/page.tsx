'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react'

type Stats = {
  totalUsers: number
  totalSellers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingProducts: number
  pendingReports: number
  recentOrders: any[]
  recentUsers: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingProducts: 0,
    pendingReports: 0,
    recentOrders: [],
    recentUsers: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Fetch sellers count
      const { count: sellersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_creator', true)

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      // Fetch pending products (if moderation_status column exists)
      const { count: pendingCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('moderation_status', 'pending')

      // Fetch orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      // Fetch total revenue
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_price')
        .eq('status', 'completed')

      const totalRevenue = revenueData?.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0) || 0

      // Fetch recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:users!orders_buyer_id_fkey(username, full_name, avatar_url),
          product:products(title, images)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch recent users
      const { data: recentUsers } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalUsers: usersCount || 0,
        totalSellers: sellersCount || 0,
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenue,
        pendingProducts: pendingCount || 0,
        pendingReports: 0, // Will add when reports table is set up
        recentOrders: recentOrders || [],
        recentUsers: recentUsers || []
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      href: '/admin/users'
    },
    {
      name: 'Active Sellers',
      value: stats.totalSellers,
      icon: Users,
      color: 'bg-purple-500',
      href: '/admin/users?filter=sellers'
    },
    {
      name: 'Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-emerald-500',
      href: '/admin/products'
    },
    {
      name: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-orange-500',
      href: '/admin/orders'
    },
    {
      name: 'Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      href: '/admin/analytics'
    },
    {
      name: 'Pending Review',
      value: stats.pendingProducts,
      icon: Clock,
      color: 'bg-yellow-500',
      href: '/admin/products?filter=pending'
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to Admin Dashboard</h1>
        <p className="opacity-90">Manage your marketplace, users, products, and orders all in one place.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
            <Link 
              href="/admin/orders" 
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats.recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No orders yet
              </div>
            ) : (
              stats.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                    {order.product?.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={order.product.images[0]} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {order.product?.title || 'Unknown Product'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      by {order.buyer?.full_name || order.buyer?.username || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ${Number(order.total_price).toFixed(2)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">New Users</h2>
            <Link 
              href="/admin/users" 
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats.recentUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No users yet
              </div>
            ) : (
              stats.recentUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                    {user.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={user.avatar_url} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.full_name || user.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.is_creator && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        Seller
                      </span>
                    )}
                    {user.is_verified && (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/admin/categories"
            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Add Category</p>
          </Link>
          <Link
            href="/admin/products?filter=pending"
            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Eye className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Review Products</p>
          </Link>
          <Link
            href="/admin/announcements"
            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Announcement</p>
          </Link>
          <Link
            href="/admin/settings"
            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Site Settings</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
