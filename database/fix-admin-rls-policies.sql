-- Fix RLS policies for admin operations
-- Run this in Supabase SQL Editor

-- ============================================
-- CATEGORIES TABLE - Fix Insert/Update/Delete
-- ============================================

-- Allow admins to manage categories (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Also allow viewing all categories (including inactive) for admins
DROP POLICY IF EXISTS "Admins can view all categories" ON public.categories;
CREATE POLICY "Admins can view all categories" ON public.categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Update the public view policy to allow viewing all active categories
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories 
    FOR SELECT USING (is_active = true);

-- ============================================
-- SITE_SETTINGS TABLE - Fix Insert/Update
-- ============================================

-- Ensure admin_users table exists and has proper structure
CREATE TABLE IF NOT EXISTS public.admin_users (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role text DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
    permissions jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure site_settings table exists
CREATE TABLE IF NOT EXISTS public.site_settings (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    key text UNIQUE NOT NULL,
    value text,
    description text,
    category text DEFAULT 'general',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on site_settings if not already
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read site settings
DROP POLICY IF EXISTS "Admins can read site settings" ON public.site_settings;
CREATE POLICY "Admins can read site settings" ON public.site_settings 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Allow admins to manage site settings (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings" ON public.site_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- ============================================
-- CATEGORIES TABLE - Add missing columns if needed
-- ============================================

-- Add is_featured column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_featured') THEN
        ALTER TABLE public.categories ADD COLUMN is_featured boolean DEFAULT false;
    END IF;
END $$;

-- Add icon column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'icon') THEN
        ALTER TABLE public.categories ADD COLUMN icon text;
    END IF;
END $$;

-- Add meta_title column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'meta_title') THEN
        ALTER TABLE public.categories ADD COLUMN meta_title text;
    END IF;
END $$;

-- Add meta_description column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'meta_description') THEN
        ALTER TABLE public.categories ADD COLUMN meta_description text;
    END IF;
END $$;

-- ============================================
-- PRODUCTS TABLE - Add subcategory support
-- ============================================

-- Add subcategory_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'subcategory_id') THEN
        ALTER TABLE public.products ADD COLUMN subcategory_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for subcategory lookups
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory_id);

-- ============================================
-- Verify setup
-- ============================================
SELECT 'RLS policies updated successfully!' as status;
