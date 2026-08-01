'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Lock, Clock, CheckCircle, FileText, User } from 'lucide-react'
import { supabase, type User as ProfileUser, type CourseDeliveryPayload, type ProductDigitalAsset } from '@/lib/supabase'
import { useCurrency } from '@/contexts/CurrencyContext'
import { convertFromUSD } from '@/lib/currency'
import Script from 'next/script'

interface CheckoutItem {
  productId: string
  packageId: string
  quantity: number
  product?: CheckoutProduct
  package?: CheckoutPackage
}

interface CheckoutCreator {
  username?: string | null
  full_name?: string | null
  avatar_url?: string | null
}

interface CheckoutProduct {
  id: string
  title?: string | null
  base_price?: number | null
  auto_message?: string | null
  auto_message_enabled?: boolean | null
  creator_id: string
  images?: string[] | null
  creator?: CheckoutCreator
  auto_deliver?: boolean | null
  is_digital?: boolean | null
  digital_files?: ProductDigitalAsset[] | null
  course_delivery?: CourseDeliveryPayload | null
}

interface CheckoutPackage {
  id: string
  name: string
  price: number
  description?: string | null
  delivery_time?: number | null
  delivery_days?: number | null
  features?: string[] | null
}

function CheckoutContent() {
  const [items, setItems] = useState<CheckoutItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<ProfileUser | null>(null)
  const { formatPrice, currency } = useCurrency()
  const [billingInfo, setBillingInfo] = useState({
    fullName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    country: ''
  })
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [commissionRate, setCommissionRate] = useState(5)
  const router = useRouter()
  const searchParams = useSearchParams()

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
      // Check Supabase authentication
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.replace(`/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
        return
      }

      // Get user profile from database
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single<ProfileUser>()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        // Create user profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email,
            username: user.email?.split('@')[0] || 'user',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0]
          }])
          .select()
          .single<ProfileUser>()

        if (createError) {
          console.error('Error creating user profile:', createError)
          router.replace(`/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
          return
        }
        setCurrentUser(newProfile)
      } else {
        setCurrentUser(userProfile)
      }
      
      setBillingInfo({
        fullName: userProfile?.full_name
          || user.user_metadata?.full_name
          || user.email?.split('@')[0]
          || '',
        email: user.email || '',
        address: '',
        city: '',
        zipCode: '',
        country: ''
      })
    } catch (error) {
      console.error('Error checking auth:', error)
      router.replace(`/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
    }
  }, [router])

  const loadCheckoutItems = useCallback(async () => {
    try {
      const itemsParam = searchParams.get('items')
      if (!itemsParam) {
        router.push('/cart')
        return
      }

  const checkoutItems = JSON.parse(decodeURIComponent(itemsParam)) as CheckoutItem[]
      
      // Fetch real product and package data from Supabase
      const itemsWithDetails = await Promise.all(
        checkoutItems.map(async (item): Promise<CheckoutItem | null> => {
          // Get product details
          const { data: product, error: productError } = await supabase
            .from('products')
            .select(`
              *,
              users!creator_id (
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('id', item.productId)
            .single<CheckoutProduct & { users?: CheckoutCreator }>()

          if (productError) {
            console.error('Error fetching product:', productError)
            return null
          }

          // Get package details
          const { data: packageData, error: packageError } = await supabase
            .from('product_packages')
            .select('*')
            .eq('id', item.packageId)
            .single<CheckoutPackage>()

          if (packageError) {
            console.error('Error fetching package:', packageError)
            return null
          }

          const { users, ...productRest } = product

          return {
            ...item,
            product: {
              ...productRest,
              creator: users
            },
            package: packageData
          } satisfies CheckoutItem
        })
      )

      // Filter out null items (failed to load)
      const validItems = itemsWithDetails.filter((item): item is CheckoutItem => item !== null)
      setItems(validItems)
    } catch (error) {
      console.error('Error loading checkout items:', error)
      router.push('/cart')
    } finally {
      setLoading(false)
    }
  }, [router, searchParams])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    loadCheckoutItems()
  }, [loadCheckoutItems])

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      const price = item.package?.price || item.product?.base_price || 0
      return total + (price * item.quantity)
    }, 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal()
  }

  const processOrderSuccess = async (orders: any[]) => {
    for (const order of orders) {
      const item = items.find(i => i.productId === order.product_id)
      const product = item?.product
      
      if (product) {
        if (product.auto_message_enabled && product.auto_message) {
          try {
            await fetch('/api/orders/auto-message', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: order.id,
                creatorId: product.creator_id,
                message: product.auto_message
              })
            })
          } catch (autoMessageError) {
            console.warn('Auto message insert failed', autoMessageError)
          }
        }

        const coursePayload = (product.course_delivery || null) as CourseDeliveryPayload | null
        const hasCoursePayload = !!(
          coursePayload &&
          ((Array.isArray(coursePayload.links) && coursePayload.links.length > 0) ||
            (Array.isArray(coursePayload.passkeys) && coursePayload.passkeys.length > 0) ||
            (coursePayload.notes && coursePayload.notes.trim()))
        )
        const hasDigitalFiles = Array.isArray(product.digital_files) && product.digital_files.length > 0
        
        if (product.auto_deliver || hasDigitalFiles || hasCoursePayload) {
          try {
            await fetch('/api/orders/auto-deliver', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: order.id, productId: product.id })
            })
          } catch (e) {}
        }
      }
      
      try {
        if (order.seller_id) {
          await fetch('/api/notifications/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: order.seller_id, type: 'order_placed', title: 'New order placed', message: `Order #${(order.id || '').toString().slice(0, 8)} has been placed`, data: { order_id: order.id } })})
        }
        if (order.buyer_id) {
          await fetch('/api/notifications/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: order.buyer_id, type: 'order_placed', title: 'Order confirmed', message: `Your order #${(order.id || '').toString().slice(0, 8)} is confirmed`, data: { order_id: order.id } })})
        }
      } catch (e) {}
    }
    router.push(`/orders/${orders[0].id}?success=true`)
  }

  const handlePayment = async () => {
    if (!currentUser || items.length === 0) return

    setProcessing(true)
    setPaymentError(null)
    try {
      const totalAmountUSD = calculateTotal()
      const totalAmountLocal = convertFromUSD(totalAmountUSD, currency || 'USD')
      
      if (totalAmountLocal === 0) {
        const verifyRes = await fetch('/api/create-free-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            buyer_id: currentUser?.id,
            billing_info: billingInfo,
            payment_method: 'free'
          })
        })

        if (!verifyRes.ok) {
          const text = await verifyRes.text()
          console.error('Free order error response:', text)
          throw new Error('Failed to create free order.')
        }

        const verifyData = await verifyRes.json()
        if (verifyData.success && verifyData.orders?.length > 0) {
          await processOrderSuccess(verifyData.orders)
          return
        } else {
          throw new Error('Verification failed for free order')
        }
      }

      const res = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmountLocal, currency: currency || 'USD' })
      })

      if (!res.ok) {
        const text = await res.text()
        console.error('Create order error response:', text)
        throw new Error('Failed to create order. Server returned an error.')
      }

      const data = await res.json()
      
      if (!data.order) {
        throw new Error('Failed to create Razorpay order')
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'FomKart',
        description: 'Order Checkout',
        order_id: data.order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/verify-razorpay-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                items,
                buyer_id: currentUser?.id,
                billing_info: billingInfo,
                payment_method: paymentMethod
              })
            })

            if (!verifyRes.ok) {
              const text = await verifyRes.text()
              console.error('Verify payment error response:', text)
              throw new Error('Verification failed. Server returned an error.')
            }

            const verifyData = await verifyRes.json()
            if (verifyData.success && verifyData.orders?.length > 0) {
              await processOrderSuccess(verifyData.orders)
            } else {
              throw new Error('Verification failed')
            }
          } catch (error) {
            console.error('Payment verification failed:', error)
            setPaymentError('Payment verification failed. Please contact support.')
            setProcessing(false)
          }
        },
        prefill: {
          name: billingInfo.fullName,
          email: billingInfo.email,
        },
        theme: {
          color: '#10b981',
        },
        modal: {
          ondismiss: function() {
            setProcessing(false)
            setPaymentError('Payment was cancelled. You can try again when you are ready.')
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed', response.error)
        setProcessing(false)
        setPaymentError('Payment failed: ' + response.error.description)
      })
      rzp.open()
    } catch (error) {
      console.error('Error in handlePayment:', error)
      setProcessing(false)
      setPaymentError(error instanceof Error ? error.message : 'An error occurred during checkout')
    }
  }

  const subtotal = calculateSubtotal()
  const total = calculateTotal()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">No items to checkout</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Please add items to your cart first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Secure Checkout</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Complete your order securely</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Forms */}
          <div className="space-y-6">
            {/* Billing Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Billing Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={billingInfo.fullName}
                    onChange={(e) => setBillingInfo({...billingInfo, fullName: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={billingInfo.email}
                    onChange={(e) => setBillingInfo({...billingInfo, email: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <input
                    type="text"
                    value={billingInfo.address}
                    onChange={(e) => setBillingInfo({...billingInfo, address: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input
                    type="text"
                    value={billingInfo.city}
                    onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={billingInfo.zipCode}
                    onChange={(e) => setBillingInfo({...billingInfo, zipCode: e.target.value})}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
              
              {/* Items */}
              <div className="space-y-4 mb-6">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.images && item.product.images.length > 0 ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.title || 'Product'}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">{item.product?.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        by {item.product?.creator?.full_name || item.product?.creator?.username}
                      </p>
                      {item.package && (
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{item.package.name} Package</p>
                      )}
                      {item.package?.delivery_days && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          {item.package.delivery_days} days
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice((item.package?.price || item.product?.base_price || 0) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white">{formatPrice(subtotal)}</span>
                </div>
              </div>
              
              <div className="flex justify-between pt-4 mb-6">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatPrice(calculateTotal())}</span>
              </div>

              {paymentError && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Payment Issue</h3>
                    <p className="mt-1 opacity-90">{paymentError}</p>
                  </div>
                </div>
              )}

              {/* Checkout Button */}
              <div>
                <Script src="https://checkout.razorpay.com/v1/checkout.js" />
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Pay with Razorpay
                    </>
                  )}
                </button>
              </div>

              <div className="mt-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>SSL encrypted and secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Money-back guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Direct communication with sellers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
