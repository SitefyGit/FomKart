'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  Loader2,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react'

type AnalyticsData = {
  totalUsers: number
  totalSellers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  newUsersThisMonth: number
  newUsersLastMonth: number
  ordersThisMonth: number
  ordersLastMonth: number
  revenueThisMonth: number
  revenueLastMonth: number
  topCategories: { name: string; count: number }[]
  topSellers: { username: string; sales: number; revenue: number }[]
  ordersByStatus: { status: string; count: number }[]
  recentDays: { date: string; orders: number; revenue: number }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      // Fetch total counts
      const [usersRes, sellersRes, productsRes, ordersRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_creator', true),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true })
      ])

      // Fetch revenue
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_price')
        .eq('status', 'completed')

      const totalRevenue = revenueData?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0

      // Fetch this month's users
      const { count: newUsersThisMonth } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonthStart.toISOString())

      // Fetch last month's users
      const { count: newUsersLastMonth } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', thisMonthStart.toISOString())

      // Fetch this month's orders
      const { data: ordersThisMonthData } = await supabase
        .from('orders')
        .select('total_price')
        .gte('created_at', thisMonthStart.toISOString())

      const ordersThisMonth = ordersThisMonthData?.length || 0
      const revenueThisMonth = ordersThisMonthData?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0

      // Fetch last month's orders
      const { data: ordersLastMonthData } = await supabase
        .from('orders')
        .select('total_price')
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', thisMonthStart.toISOString())

      const ordersLastMonth = ordersLastMonthData?.length || 0
      const revenueLastMonth = ordersLastMonthData?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0

      // Fetch orders by status
      const { data: statusData } = await supabase
        .from('orders')
        .select('status')

      const statusCounts: Record<string, number> = {}
      statusData?.forEach(o => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
      })
      const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

      // Fetch top categories
      const { data: categoryData } = await supabase
        .from('products')
        .select('category_id, categories(name)')

      const categoryCounts: Record<string, number> = {}
      categoryData?.forEach((p: any) => {
        const name = p.categories?.name || 'Uncategorized'
        categoryCounts[name] = (categoryCounts[name] || 0) + 1
      })
      const topCategories = Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Fetch top sellers
      const { data: sellerData } = await supabase
        .from('orders')
        .select('seller_id, total_price, seller:users!orders_seller_id_fkey(username)')
        .eq('status', 'completed')

      const sellerStats: Record<string, { sales: number; revenue: number; username: string }> = {}
      sellerData?.forEach((o: any) => {
        const id = o.seller_id
        if (!sellerStats[id]) {
          sellerStats[id] = { sales: 0, revenue: 0, username: o.seller?.username || 'Unknown' }
        }
        sellerStats[id].sales += 1
        sellerStats[id].revenue += Number(o.total_price)
      })
      const topSellers = Object.values(sellerStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Generate recent days data
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90
      const recentDays = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        recentDays.push({
          date: date.toISOString().split('T')[0],
          orders: Math.floor(Math.random() * 20) + 5, // Placeholder - would need real aggregation
          revenue: Math.floor(Math.random() * 1000) + 200
        })
      }

      setData({
        totalUsers: usersRes.count || 0,
        totalSellers: sellersRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalRevenue,
        newUsersThisMonth: newUsersThisMonth || 0,
        newUsersLastMonth: newUsersLastMonth || 0,
        ordersThisMonth,
        ordersLastMonth,
        revenueThisMonth,
        revenueLastMonth,
        topCategories,
        topSellers,
        ordersByStatus,
        recentDays
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!data) return null

  const usersChange = getPercentageChange(data.newUsersThisMonth, data.newUsersLastMonth)
  const ordersChange = getPercentageChange(data.ordersThisMonth, data.ordersLastMonth)
  const revenueChange = getPercentageChange(data.revenueThisMonth, data.revenueLastMonth)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your marketplace performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className={`flex items-center gap-1 text-sm ${usersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {usersChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(usersChange).toFixed(1)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.totalUsers.toLocaleString()}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            +{data.newUsersThisMonth} this month
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.totalProducts.toLocaleString()}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Products</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {data.totalSellers} sellers
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className={`flex items-center gap-1 text-sm ${ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ordersChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(ordersChange).toFixed(1)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.totalOrders.toLocaleString()}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Orders</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {data.ordersThisMonth} this month
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className={`flex items-center gap-1 text-sm ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(revenueChange).toFixed(1)}%
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">${data.totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            ${data.revenueThisMonth.toLocaleString()} this month
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Categories</h2>
          </div>
          <div className="space-y-4">
            {data.topCategories.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No data yet</p>
            ) : (
              data.topCategories.map((cat, i) => {
                const maxCount = data.topCategories[0]?.count || 1
                const percentage = (cat.count / maxCount) * 100
                const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500']
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{cat.count} products</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`${colors[i % colors.length]} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Orders by Status</h2>
          </div>
          <div className="space-y-4">
            {data.ordersByStatus.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No data yet</p>
            ) : (
              data.ordersByStatus.map((item) => {
                const total = data.ordersByStatus.reduce((sum, s) => sum + s.count, 0)
                const percentage = total > 0 ? (item.count / total) * 100 : 0
                const statusColors: Record<string, string> = {
                  pending: 'bg-yellow-500',
                  confirmed: 'bg-blue-500',
                  processing: 'bg-indigo-500',
                  shipped: 'bg-purple-500',
                  delivered: 'bg-teal-500',
                  completed: 'bg-green-500',
                  cancelled: 'bg-red-500',
                  refunded: 'bg-gray-500'
                }
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{item.status}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`${statusColors[item.status] || 'bg-gray-500'} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Sellers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Sellers</h2>
        </div>
        {data.topSellers.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No sales data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Rank</th>
                  <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Seller</th>
                  <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Sales</th>
                  <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topSellers.map((seller, i) => (
                  <tr key={seller.username} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                    <td className="py-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-gray-200 text-gray-700' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-gray-900 dark:text-white font-medium">@{seller.username}</span>
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-400">{seller.sales}</td>
                    <td className="py-3 text-right font-medium text-gray-900 dark:text-white">
                      ${seller.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
