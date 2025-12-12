import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Your Supabase project configuration - uses lazy initialization to prevent build-time errors
let _supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://upmbvugogybdutqoqern.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseAnonKey) {
    console.warn('Supabase client missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return createClient(supabaseUrl, 'placeholder-key')
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey)
  return _supabase
}

// Export as a getter to allow lazy initialization
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase()
    const value = client[prop as keyof SupabaseClient]
    return typeof value === 'function' ? value.bind(client) : value
  }
})

// Types for our database
export interface User {
  id: string
  username: string
  full_name?: string
  email?: string
  avatar_url?: string
  bio?: string
  location?: string
  website?: string
  social_links?: Record<string, string>
  is_creator?: boolean
  is_verified?: boolean
  subscription_tier?: 'free' | 'pro' | 'premium'
  total_earnings?: number
  total_sales?: number
  rating?: number
  total_reviews?: number
  background_image?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  creator_id: string
  category_id?: string
  title: string
  slug: string
  description?: string
  short_description?: string
  type: 'product' | 'service'
  base_price: number
  currency?: string
  delivery_time?: number
  revisions?: number
  features?: string[]
  requirements?: string[]
  images?: string[]
  videos?: string[]
  thumbnails?: string[]
  tags?: string[]
  keywords?: string[]
  status?: 'draft' | 'active' | 'paused' | 'sold_out' | 'archived'
  stock_quantity?: number
  is_digital?: boolean
  is_featured?: boolean
  views?: number
  orders_count?: number
  rating?: number
  reviews_count?: number
  created_at: string
  updated_at: string
  creator?: User
  category?: Category
  packages?: ProductPackage[]
}

export interface CreatorPost {
  id: string
  creator_id: string
  caption?: string | null
  post_type: 'text' | 'image' | 'video'
  media_url?: string | null
  video_url?: string | null
  video_provider?: string | null
  video_id?: string | null
  link_url?: string | null
  tags?: string[] | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface ProductPackage {
  id: string
  product_id: string
  name: string
  description?: string
  price: number
  delivery_time?: number
  revisions?: number
  features?: string[]
  is_popular?: boolean
  sort_order?: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  parent_id?: string
  is_active?: boolean
  sort_order?: number
  created_at: string
}

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

type JsonRecord = Record<string, Json>

export interface Order {
  id: string
  order_number: string
  buyer_id: string
  seller_id: string
  product_id: string
  package_id?: string
  quantity: number
  unit_price: number
  total_price: number
  service_fee: number
  requirements?: JsonRecord
  special_instructions?: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'revision_requested' | 'delivered' | 'completed' | 'cancelled' | 'refunded' | 'disputed'
  expected_delivery?: string
  delivered_at?: string
  completed_at?: string
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  payment_method?: string
  transaction_id?: string
  created_at: string
  updated_at: string
  buyer?: User
  seller?: User
  product?: Product
  package?: ProductPackage
  deliverables?: OrderDeliverable[]
  messages?: OrderMessage[]
}

export interface OrderDeliverable {
  id: string
  order_id: string
  file_name: string
  file_url: string
  file_size?: number
  file_type?: string
  description?: string
  uploaded_by: string
  created_at: string
}

export interface OrderMessage {
  id: string
  order_id: string
  sender_id: string
  message: string
  attachments?: string[]
  is_system_message?: boolean
  created_at: string
  sender?: User
}

export interface Review {
  id: string
  order_id: string
  product_id: string
  reviewer_id: string
  seller_id: string
  rating: number
  title?: string
  comment?: string
  is_public?: boolean
  created_at: string
  reviewer?: User
}

export interface Cart {
  id: string
  user_id: string
  product_id: string
  package_id?: string
  quantity: number
  requirements?: JsonRecord
  special_instructions?: string
  created_at: string
  product?: Product
  package?: ProductPackage
}

// Helper functions
export const getUser = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching user:', error)
    return null
  }
  
  return data
}

export const getProduct = async (productId: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      creator:creator_id(username, full_name, avatar_url, is_verified),
      category:category_id(name, slug),
      packages:product_packages(*)
    `)
    .eq('id', productId)
    .eq('status', 'active')
    .single()
  
  if (error) {
    console.error('Error fetching product:', error)
    return null
  }
  
  return data
}

export const getUserProducts = async (userId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:category_id(name, slug),
      packages:product_packages(*)
    `)
    .eq('creator_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user products:', error)
    return []
  }
  
  return data || []
}

export const createOrder = async (orderData: {
  buyer_id: string
  seller_id: string
  product_id: string
  package_id?: string
  quantity?: number
  unit_price: number
  total_price: number
  service_fee?: number
  requirements?: JsonRecord
  special_instructions?: string
}): Promise<Order | null> => {
  // Generate unique order number
  const orderNumber = `FO${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  
  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      ...orderData,
      status: 'pending',
      payment_status: 'pending'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating order:', error)
    return null
  }
  
  return data
}

export const getUserOrders = async (userId: string, type: 'buyer' | 'seller' = 'buyer'): Promise<Order[]> => {
  const column = type === 'buyer' ? 'buyer_id' : 'seller_id'
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:buyer_id(username, full_name, avatar_url),
      seller:seller_id(username, full_name, avatar_url),
      product:product_id(title, images),
      package:package_id(name, description)
    `)
    .eq(column, userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }
  
  return data || []
}
