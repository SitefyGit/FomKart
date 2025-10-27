-- FomKart Complete Database Setup
-- Project ID: upmbvugogybdutqoqern
-- Run this SQL in your Supabase SQL Editor

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  email text,
  avatar_url text,
  bio text,
  location text,
  website text,
  social_links jsonb default '{}'::jsonb,
  is_creator boolean default false,
  is_verified boolean default false,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'premium')),
  total_earnings numeric(10,2) default 0,
  total_sales integer default 0,
  rating numeric(3,2) default 0,
  total_reviews integer default 0,
  background_image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  parent_id uuid references public.categories(id) on delete cascade,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products table (includes both physical products and digital services)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.users(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  slug text unique not null,
  description text,
  short_description text,
  type text not null check (type in ('product', 'service')),
  
  -- Pricing
  base_price numeric(10,2) not null,
  currency text default 'USD',
  
  -- Product/Service specific fields
  delivery_time integer, -- in days for services, shipping time for products
  revisions integer, -- for services
  features text[], -- array of features/what's included
  requirements text[], -- what buyer needs to provide
  
  -- Media
  images text[] default '{}',
  videos text[] default '{}',
  thumbnails text[] default '{}',
  
  -- SEO and discovery
  tags text[] default '{}',
  keywords text[] default '{}',
  
  -- Post-purchase automation
  auto_message text,
  auto_message_enabled boolean default false,

  -- Status and inventory
  status text default 'active' check (status in ('draft', 'active', 'paused', 'sold_out', 'archived')),
  stock_quantity integer, -- null for unlimited (services)
  is_digital boolean default false,
  is_featured boolean default false,
  
  -- Analytics
  views integer default 0,
  orders_count integer default 0,
  rating numeric(3,2) default 0,
  reviews_count integer default 0,
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Product packages/tiers (basic, standard, premium)
CREATE TABLE IF NOT EXISTS public.product_packages (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  name text not null, -- Basic, Standard, Premium
  description text,
  price numeric(10,2) not null,
  delivery_time integer, -- in days
  revisions integer,
  features text[] default '{}',
  is_popular boolean default false,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid default uuid_generate_v4() primary key,
  order_number text unique not null,
  buyer_id uuid references public.users(id) on delete cascade not null,
  seller_id uuid references public.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  package_id uuid references public.product_packages(id) on delete set null,
  
  -- Order details
  quantity integer default 1,
  unit_price numeric(10,2) not null,
  total_price numeric(10,2) not null,
  service_fee numeric(10,2) default 0,
  
  -- Requirements and communication
  requirements jsonb default '{}'::jsonb, -- buyer's requirements
  special_instructions text,
  
  -- Status tracking
  status text default 'pending' check (status in (
    'pending', 'confirmed', 'in_progress', 'revision_requested', 
    'delivered', 'completed', 'cancelled', 'refunded', 'disputed'
  )),
  
  -- Timeline
  expected_delivery timestamp with time zone,
  delivered_at timestamp with time zone,
  completed_at timestamp with time zone,
  
  -- Payment
  payment_status text default 'pending' check (payment_status in (
    'pending', 'processing', 'completed', 'failed', 'refunded'
  )),
  payment_method text,
  transaction_id text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Order deliverables/attachments
CREATE TABLE IF NOT EXISTS public.order_deliverables (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  file_name text not null,
  file_url text not null,
  file_size integer,
  file_type text,
  description text,
  uploaded_by uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Order messages/communication
CREATE TABLE IF NOT EXISTS public.order_messages (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  message text not null,
  attachments text[] default '{}',
  is_system_message boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reviews and ratings
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  reviewer_id uuid references public.users(id) on delete cascade not null,
  seller_id uuid references public.users(id) on delete cascade not null,
  
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  comment text,
  is_public boolean default true,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Carts (for temporary storage before checkout)
CREATE TABLE IF NOT EXISTS public.carts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  package_id uuid references public.product_packages(id) on delete cascade,
  quantity integer default 1,
  requirements jsonb default '{}'::jsonb,
  special_instructions text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  data jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Subscriptions (following relationships)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  subscriber_id uuid references public.users(id) on delete cascade not null,
  creator_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(subscriber_id, creator_id)
);

-- Newsletter subscriptions (Lead Capture System)
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  creator_id uuid references public.users(id) on delete cascade,
  name text,
  preferences jsonb default '{}'::jsonb, -- Store audience preferences
  source text default 'lead_form', -- track where subscription came from
  status text default 'active' check (status in ('active', 'unsubscribed', 'bounced')),
  confirmed boolean default false,
  confirmation_token text,
  tags text[] default '{}', -- for segmentation
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(email, creator_id)
);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can view public profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (is_active = true);

-- Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Creators can manage own products" ON public.products;

CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "Creators can manage own products" ON public.products FOR ALL USING (auth.uid() = creator_id);

-- Product packages
ALTER TABLE public.product_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view product packages" ON public.product_packages;
DROP POLICY IF EXISTS "Creators can manage own product packages" ON public.product_packages;

CREATE POLICY "Anyone can view product packages" ON public.product_packages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND status = 'active')
);
CREATE POLICY "Creators can manage own product packages" ON public.product_packages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND creator_id = auth.uid())
);

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Buyers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Order participants can update orders" ON public.orders;

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Order participants can update orders" ON public.orders FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Order deliverables
ALTER TABLE public.order_deliverables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Order participants can view deliverables" ON public.order_deliverables;
DROP POLICY IF EXISTS "Order participants can manage deliverables" ON public.order_deliverables;

CREATE POLICY "Order participants can view deliverables" ON public.order_deliverables FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
);
CREATE POLICY "Order participants can manage deliverables" ON public.order_deliverables FOR ALL USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
);

-- Order messages
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Order participants can view messages" ON public.order_messages;
DROP POLICY IF EXISTS "Order participants can send messages" ON public.order_messages;

CREATE POLICY "Order participants can view messages" ON public.order_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
);
CREATE POLICY "Order participants can send messages" ON public.order_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND 
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
);

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view public reviews" ON public.reviews;
DROP POLICY IF EXISTS "Order participants can create reviews" ON public.reviews;

CREATE POLICY "Anyone can view public reviews" ON public.reviews FOR SELECT USING (is_public = true);
CREATE POLICY "Order participants can create reviews" ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id AND 
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
);

-- Carts
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own cart" ON public.carts;
CREATE POLICY "Users can manage own cart" ON public.carts FOR ALL USING (auth.uid() = user_id);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (
  auth.uid() = subscriber_id OR auth.uid() = creator_id
);
CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = subscriber_id);

-- Newsletter subscriptions
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creators can view their newsletter subscribers" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletters" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Creators can update their newsletter subscriptions" ON public.newsletter_subscriptions;

CREATE POLICY "Creators can view their newsletter subscribers" ON public.newsletter_subscriptions FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Anyone can subscribe to newsletters" ON public.newsletter_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Creators can update their newsletter subscriptions" ON public.newsletter_subscriptions FOR UPDATE USING (auth.uid() = creator_id);

-- ============================================================================
-- 4. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function for updating timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS newsletter_subscriptions_updated_at ON public.newsletter_subscriptions;

-- Create triggers for updated_at
CREATE TRIGGER users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER products_updated_at 
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER orders_updated_at 
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER newsletter_subscriptions_updated_at 
  BEFORE UPDATE ON public.newsletter_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 5. SAMPLE DATA
-- ============================================================================

-- Insert sample categories
INSERT INTO public.categories (name, slug, description, image_url, sort_order) VALUES
  ('Digital Marketing', 'digital-marketing', 'SEO, Social Media, PPC and more', '/categories/digital-marketing.jpg', 1),
  ('Writing & Translation', 'writing-translation', 'Content writing, copywriting, translation', '/categories/writing.jpg', 2),
  ('Graphics & Design', 'graphics-design', 'Logo design, web design, illustrations', '/categories/design.jpg', 3),
  ('Programming & Tech', 'programming-tech', 'Web development, mobile apps, software', '/categories/programming.jpg', 4),
  ('Video & Animation', 'video-animation', 'Video editing, animation, motion graphics', '/categories/video.jpg', 5),
  ('Music & Audio', 'music-audio', 'Voice over, music production, audio editing', '/categories/audio.jpg', 6),
  ('Business', 'business', 'Business plans, market research, presentations', '/categories/business.jpg', 7),
  ('Lifestyle', 'lifestyle', 'Gaming, health, fitness, travel', '/categories/lifestyle.jpg', 8)
ON CONFLICT (slug) DO NOTHING;

-- Create sample user (you'll need to create this via Supabase Auth first)
-- This is just for reference - actual user creation should be done through your app
/*
INSERT INTO public.users (id, username, full_name, email, bio, is_creator, is_verified) VALUES
  ('your-user-id-here', 'designpro', 'Design Professional', 'creator@fomkart.com', 'Professional designer creating amazing digital products', true, true)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  bio = EXCLUDED.bio,
  is_creator = EXCLUDED.is_creator,
  is_verified = EXCLUDED.is_verified;
*/

-- ============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_creator ON public.users(is_creator);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_creator_id ON public.products(creator_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Newsletter subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_creator_id ON public.newsletter_subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON public.newsletter_subscriptions(status);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON public.reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Carts indexes
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

-- Your FomKart database is now ready!
-- Next steps:
-- 1. Update your .env.local file with Supabase credentials
-- 2. Test the connection from your Next.js app
-- 3. Create your first user through the auth system
-- 4. Start adding products and testing the e-commerce flow

SELECT 'FomKart database setup completed successfully!' as message;
