import { createClient } from '@supabase/supabase-js'

// For development, use placeholder values if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface User {
  id: string
  username: string
  full_name: string
  email?: string
  avatar_url?: string
  bio?: string
  rating: number
  total_reviews: number
  is_verified?: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  title: string
  description: string
  images: string[]
  starting_price: number
  base_price?: number
  type: 'service' | 'product'
  creator_id: string
  category_id: string
  tags: string[]
  featured: boolean
  status: 'active' | 'inactive' | 'draft'
  created_at: string
  updated_at: string
  creator?: User
  packages?: ProductPackage[]
  category?: Category
}

export interface ProductPackage {
  id: string
  product_id: string
  name: string
  description: string
  price: number
  delivery_days: number
  revisions: number
  features: string[]
  popular?: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  parent_id?: string
  created_at: string
  updated_at: string
}

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

export type JsonRecord = Record<string, Json>

export interface Order {
  id: string
  order_number: string
  buyer_id: string
  seller_id: string
  product_id: string
  package_id: string
  quantity: number
  unit_price: number
  service_fee: number
  total_price: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'revision_requested' | 'delivered' | 'completed' | 'cancelled' | 'refunded'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  requirements?: JsonRecord
  special_instructions?: string
  expected_delivery?: string
  delivered_at?: string
  created_at: string
  updated_at: string
  buyer?: User
  seller?: User
  product?: Product
  package?: ProductPackage
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  package_id: string
  quantity: number
  requirements?: JsonRecord
  special_instructions?: string
  created_at: string
  updated_at: string
  product?: Product
  package?: ProductPackage
}

export interface Review {
  id: string
  order_id: string
  product_id: string
  reviewer_id: string
  seller_id: string
  rating: number
  comment: string
  is_public: boolean
  created_at: string
  updated_at: string
  reviewer?: User
  seller?: User
  product?: Product
}

export interface OrderMessage {
  id: string
  order_id: string
  sender_id: string
  message: string
  is_system_message: boolean
  created_at: string
  sender?: User
}

export interface OrderDeliverable {
  id: string
  order_id: string
  file_name: string
  file_url: string
  file_size: number
  description?: string
  created_at: string
}

// Notifications
export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data?: JsonRecord
  is_read?: boolean
  created_at: string
}

// Auth helpers
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Product helpers
export const getProduct = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        creator:creator_id(*),
        packages:product_packages(*),
        category:category_id(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

export const getProducts = async (filters?: {
  category?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<Product[]> => {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        creator:creator_id(*),
        category:category_id(*)
      `)
      .eq('status', 'active')

    if (filters?.category) {
      query = query.eq('category_id', filters.category)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

// Cart helpers
export const addToCart = async (item: {
  product_id: string
  package_id: string
  quantity: number
  requirements?: JsonRecord
  special_instructions?: string
}): Promise<boolean> => {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('carts')
      .insert({
        user_id: user.id,
        ...item
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error adding to cart:', error)
    return false
  }
}

export const getCartItems = async (): Promise<CartItem[]> => {
  try {
    const user = await getCurrentUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('carts')
      .select(`
        *,
        product:product_id(*),
        package:package_id(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching cart items:', error)
    return []
  }
}

// Orders helpers
export const getUserOrders = async (
  userId: string,
  type: 'buyer' | 'seller' = 'buyer'
): Promise<Order[]> => {
  try {
    const column = type === 'buyer' ? 'buyer_id' : 'seller_id'
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:buyer_id(username, full_name, avatar_url),
        seller:seller_id(username, full_name, avatar_url),
        product:product_id(title, images),
        package:package_id(name, description, price, delivery_time)
      `)
      .eq(column, userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching user orders:', error)
    return []
  }
}

type OrderWithRelations = Order & {
  product?: Product | null
  package?: ProductPackage | null
  seller?: Pick<User, 'id' | 'username' | 'full_name' | 'avatar_url'> | null
  buyer?: Pick<User, 'id' | 'username' | 'full_name' | 'avatar_url'> | null
}

export const getOrderById = async (orderId: string): Promise<OrderWithRelations | null> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        product:product_id (*),
        package:package_id (*),
        seller:seller_id (id, username, full_name, avatar_url),
        buyer:buyer_id (id, username, full_name, avatar_url)
      `)
      .eq('id', orderId)
      .single()

    if (error) throw error
    const orderData = data as OrderWithRelations
    return {
      ...orderData,
      product: orderData.product ?? undefined,
      package: orderData.package ?? undefined,
      seller: orderData.seller ?? undefined,
      buyer: orderData.buyer ?? undefined
    }
  } catch (error) {
    console.error('Error fetching order by id:', error)
    return null
  }
}

export const getOrderMessages = async (orderId: string): Promise<OrderMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('order_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching order messages:', error)
    return []
  }
}

export const sendOrderMessage = async (params: {
  order_id: string
  sender_id: string
  message: string
  attachments?: string[]
  is_system_message?: boolean
}) => {
  try {
    const { error } = await supabase.from('order_messages').insert({
      order_id: params.order_id,
      sender_id: params.sender_id,
      message: params.message,
      attachments: params.attachments || [],
      is_system_message: !!params.is_system_message
    })
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error sending order message:', error)
    return false
  }
}

export const listDeliverables = async (orderId: string): Promise<OrderDeliverable[]> => {
  try {
    const { data, error } = await supabase
      .from('order_deliverables')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching deliverables:', error)
    return []
  }
}

export const createDeliverable = async (params: {
  order_id: string
  uploaded_by: string
  description?: string
  files: { name: string; blob: Blob }[]
}) => {
  try {
    const uploaded: { file_name: string; file_url: string; file_size: number }[] = []
    for (const f of params.files) {
      const stamp = Date.now().toString(36)
      const path = `${params.order_id}/deliveries/${stamp}-${encodeURIComponent(f.name)}`
      const { error: upErr } = await supabase.storage
        .from('order-deliveries')
        .upload(path, f.blob, { upsert: true })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from('order-deliveries').getPublicUrl(path)
      uploaded.push({ file_name: f.name, file_url: pub.publicUrl, file_size: f.blob.size })
    }
    // Insert one row per uploaded file
    const rows = uploaded.map(u => ({
      order_id: params.order_id,
      file_name: u.file_name,
      file_url: u.file_url,
      file_size: u.file_size,
      description: params.description || null,
      uploaded_by: params.uploaded_by
    }))
    const { error } = await supabase.from('order_deliverables').insert(rows)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error creating deliverable:', error)
    return false
  }
}

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating order status:', error)
    return false
  }
}

// Update order requirements (typically by buyer) and optionally set status to in_progress
export const updateOrderRequirements = async (
  orderId: string,
  requirements: JsonRecord,
  setInProgress = true
) => {
  try {
    const patch: Partial<Pick<Order, 'requirements' | 'status'>> = { requirements }
    if (setInProgress) patch.status = 'in_progress'
    const { error } = await supabase
      .from('orders')
      .update(patch)
      .eq('id', orderId)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating order requirements:', error)
    return false
  }
}

// Create a notification for a user
export const createNotification = async (params: {
  user_id: string
  type: string
  title: string
  message: string
  data?: JsonRecord
}) => {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: params.user_id,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || {}
    })
    if (error) throw error
    return true
  } catch (error) {
    if (error && typeof error === 'object') {
      const err = error as { message?: string; details?: string; hint?: string; code?: string }
      console.error('Error creating notification:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      })
    } else {
      console.error('Error creating notification:', error)
    }
    return false
  }
}

export const listNotifications = async (userId: string, limit = 20): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

export const markNotificationRead = async (id: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

export const markAllNotificationsRead = async (userId: string) => {
  try {
    // Update all unread notifications for this user
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    // Return false to let caller handle it; UI can still locally mark as read.
    return false
  }
}
