'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  CreditCard, 
  ArrowRight,
  Clock
} from 'lucide-react'
import { supabase, type User } from '@/lib/supabase'

// Local type for cart items with normalized relationships
interface CartItemNormalized {
  id: string
  user_id: string
  product_id: string
  package_id: string
  quantity: number
  requirements?: Record<string, unknown>
  special_instructions?: string
  created_at: string
  product?: {
    id: string
    title: string
    description?: string
    images?: string[]
    base_price: number
    type: string
    creator?: {
      username: string
      full_name?: string
      avatar_url?: string
    }
  }
  package?: {
    id: string
    name: string
    description?: string
    price: number
    delivery_time?: number
    delivery_days?: number
    features?: string[]
  }
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemNormalized[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [commissionRate, setCommissionRate] = useState(5)
  const router = useRouter()

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'commission_rate')
        .single()
      
      if (data?.value) {
        setCommissionRate(parseFloat(data.value))
      }
    }
    fetchSettings()
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setCurrentUser(data as User)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/auth/login')
    }
  }, [router])

  const fetchCartItems = useCallback(async () => {
    if (!currentUser) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('carts')
        .select(`
          id,
          user_id,
          product_id,
          package_id,
          quantity,
          requirements,
          special_instructions,
          created_at,
          product:products!product_id(
            id,
            title,
            description,
            images,
            base_price,
            type,
            creator:users!creator_id(username, full_name, avatar_url)
          ),
          package:product_packages!package_id(
            id,
            name,
            description,
            price,
            delivery_time,
            features
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error.message, error.code, error.details)
        throw error
      }
      
      // Normalize the data - Supabase returns arrays for joins, we need single objects
      const normalizedData = (data ?? []).map((item: Record<string, unknown>) => {
        const product = Array.isArray(item.product) ? item.product[0] : item.product
        // Also normalize creator inside product
        if (product && typeof product === 'object') {
          const productObj = product as Record<string, unknown>
          if (Array.isArray(productObj.creator)) {
            productObj.creator = productObj.creator[0]
          }
        }
        return {
          ...item,
          product,
          package: Array.isArray(item.package) ? item.package[0] : item.package,
        }
      }) as CartItemNormalized[]
      
      setCartItems(normalizedData)
    } catch (error) {
      console.error('Error fetching cart items:', error)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (currentUser) {
      fetchCartItems()
    }
  }, [currentUser, fetchCartItems])

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId)
      return
    }

    setUpdating(itemId)
    try {
      const { error } = await supabase
        .from('carts')
        .update({ quantity: newQuantity })
        .eq('id', itemId)

      if (error) throw error

      setCartItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      )
    } catch (error) {
      console.error('Error updating quantity:', error)
      alert('Failed to update quantity. Please try again.')
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: string) => {
    setUpdating(itemId)
    try {
      const { error } = await supabase
        .from('carts')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setCartItems(items => items.filter(item => item.id !== itemId))
      // Dispatch event to update cart icon
      window.dispatchEvent(new CustomEvent('cart-updated'))
    } catch (error) {
      console.error('Error removing item:', error)
      alert('Failed to remove item. Please try again.')
    } finally {
      setUpdating(null)
    }
  }

  const proceedToCheckout = () => {
    if (cartItems.length === 0) return

    try {
      // Create checkout URL with cart items
      const checkoutData = cartItems.map(item => ({
        productId: item.product_id,
        packageId: item.package_id,
        quantity: item.quantity,
        requirements: item.requirements || {}
      }))

      const checkoutUrl = `/checkout?items=${encodeURIComponent(JSON.stringify(checkoutData))}`
      router.push(checkoutUrl)
    } catch (error) {
      console.error('Error preparing checkout:', error)
      alert('Failed to proceed to checkout. Please try again.')
    }
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.package?.price
        ?? item.product?.base_price
        ?? 0
      return total + price * item.quantity
    }, 0)
  }

  const calculateServiceFee = (subtotal: number) => {
    return Math.round(subtotal * (commissionRate / 100) * 100) / 100
  }

  const subtotal = calculateSubtotal()
  const serviceFee = calculateServiceFee(subtotal)
  const total = subtotal + serviceFee

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading cart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            <Link
              href="/"
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cartItems.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Looks like you haven&apos;t added any items to your cart yet.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Start Shopping
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cart Items</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Product Image */}
                        <div className="w-full sm:w-24 h-48 sm:h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                          {item.product?.images && item.product.images.length > 0 ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.title || 'Product'}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                <Link
                                  href={`/product/${item.product_id}`}
                                  className="hover:text-emerald-600 dark:hover:text-emerald-400"
                                >
                                  {item.product?.title}
                                </Link>
                              </h3>
                              
                              {/* Creator */}
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                by{' '}
                                <Link
                                  href={`/creator/${item.product?.creator?.username}`}
                                  className="font-medium hover:text-emerald-600 dark:hover:text-emerald-400"
                                >
                                  {item.product?.creator?.full_name || item.product?.creator?.username}
                                </Link>
                              </p>

                              {/* Package */}
                              {item.package && (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mb-3">
                                  <div className="font-medium text-emerald-900 dark:text-emerald-300">{item.package.name} Package</div>
                                  <div className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                                    {item.package.description}
                                  </div>
                                  {(item.package.delivery_time || item.package.delivery_days) && (
                                    <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                                      <Clock className="w-4 h-4" />
                                      {item.package.delivery_time || item.package.delivery_days} days delivery
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Requirements */}
                              {item.requirements && Object.keys(item.requirements).length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
                                  <div className="font-medium text-gray-900 dark:text-white mb-2">Requirements</div>
                                  <div className="space-y-1">
                                    {Object.entries(item.requirements).map(([key, value]) => (
                                      <div key={key} className="text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>{' '}
                                        <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Price */}
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                  ${item.package?.price || item.product?.base_price}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">per item</span>
                              </div>
                            </div>

                            {/* Quantity and Remove */}
                            <div className="flex sm:flex-col items-center sm:items-end gap-4">
                              {/* Quantity Controls */}
                              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={updating === item.id || item.quantity <= 1}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <div className="px-4 py-2 text-center min-w-[3rem] text-gray-900 dark:text-white">
                                  {updating === item.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                                  ) : (
                                    item.quantity
                                  )}
                                </div>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  disabled={updating === item.id}
                                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() => removeItem(item.id)}
                                disabled={updating === item.id}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Remove from cart"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Item Total</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ${((item.package?.price || item.product?.base_price || 0) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal ({cartItems.length} items)</span>
                    <span className="text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Service Fee (5%)</span>
                    <span className="text-gray-900 dark:text-white">${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                      <span className="font-bold text-xl text-gray-900 dark:text-white">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={proceedToCheckout}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Proceed to Checkout
                </button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                  Secure checkout powered by Stripe
                </p>

                {/* Trust Indicators */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Secure payment processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Money-back guarantee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>24/7 customer support</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
