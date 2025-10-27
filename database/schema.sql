-- FomKart Database Schema
-- This schema supports products, services, orders, and delivery tracking

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
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
create table public.categories (
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
create table public.products (
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
create table public.product_packages (
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
create table public.orders (
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
create table public.order_deliverables (
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
create table public.order_messages (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  message text not null,
  attachments text[] default '{}',
  is_system_message boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reviews and ratings
create table public.reviews (
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
create table public.carts (
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
create table public.notifications (
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
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  subscriber_id uuid references public.users(id) on delete cascade not null,
  creator_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(subscriber_id, creator_id)
);

-- Newsletter subscriptions
create table public.newsletter_subscriptions (
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

-- Row Level Security (RLS) Policies

-- Users
alter table public.users enable row level security;
create policy "Users can view public profiles" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- Products
alter table public.products enable row level security;
create policy "Anyone can view active products" on public.products for select using (status = 'active');
create policy "Creators can manage own products" on public.products for all using (auth.uid() = creator_id);

-- Orders
alter table public.orders enable row level security;
create policy "Users can view own orders" on public.orders for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "Buyers can create orders" on public.orders for insert with check (auth.uid() = buyer_id);
create policy "Sellers can update order status" on public.orders for update using (auth.uid() = seller_id);

-- Reviews
alter table public.reviews enable row level security;
create policy "Anyone can view public reviews" on public.reviews for select using (is_public = true);
create policy "Order participants can create reviews" on public.reviews for insert with check (
  auth.uid() = reviewer_id and 
  exists (select 1 from public.orders where id = order_id and (buyer_id = auth.uid() or seller_id = auth.uid()))
);

-- Newsletter subscriptions
alter table public.newsletter_subscriptions enable row level security;
create policy "Creators can view their newsletter subscribers" on public.newsletter_subscriptions for select using (auth.uid() = creator_id);
create policy "Anyone can subscribe to newsletters" on public.newsletter_subscriptions for insert with check (true);
create policy "Creators can update their newsletter subscriptions" on public.newsletter_subscriptions for update using (auth.uid() = creator_id);

-- Functions for updating timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger users_updated_at before update on public.users
  for each row execute procedure public.handle_updated_at();

create trigger products_updated_at before update on public.products
  for each row execute procedure public.handle_updated_at();

create trigger orders_updated_at before update on public.orders
  for each row execute procedure public.handle_updated_at();

create trigger newsletter_subscriptions_updated_at before update on public.newsletter_subscriptions
  for each row execute procedure public.handle_updated_at();

-- Sample categories
insert into public.categories (name, slug, description) values
  ('Digital Marketing', 'digital-marketing', 'SEO, Social Media, PPC and more'),
  ('Writing & Translation', 'writing-translation', 'Content writing, copywriting, translation'),
  ('Graphics & Design', 'graphics-design', 'Logo design, web design, illustrations'),
  ('Programming & Tech', 'programming-tech', 'Web development, mobile apps, software'),
  ('Video & Animation', 'video-animation', 'Video editing, animation, motion graphics'),
  ('Music & Audio', 'music-audio', 'Voice over, music production, audio editing'),
  ('Business', 'business', 'Business plans, market research, presentations'),
  ('Lifestyle', 'lifestyle', 'Gaming, health, fitness, travel');

-- Storage: allow users to delete their own files from common buckets
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can delete own avatar files'
  ) then
    create policy "Users can delete own avatar files" on storage.objects
      for delete to authenticated
      using (bucket_id = 'avatars' and owner = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can delete own cover files'
  ) then
    create policy "Users can delete own cover files" on storage.objects
      for delete to authenticated
      using (bucket_id = 'covers' and owner = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can delete own product images'
  ) then
    create policy "Users can delete own product images" on storage.objects
      for delete to authenticated
      using (bucket_id = 'product-images' and owner = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Users can delete own product covers'
  ) then
    create policy "Users can delete own product covers" on storage.objects
      for delete to authenticated
      using (bucket_id = 'product-covers' and owner = auth.uid());
  end if;
end $$;

