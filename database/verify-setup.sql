-- Quick Database Setup Verification
-- Run this to check if your database is properly set up

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'users', 'categories', 'products', 'product_packages', 
    'orders', 'reviews', 'newsletter_subscriptions'
  )
ORDER BY table_name;

-- Check RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Check if auth.users table has any users
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check if public.users table exists and is accessible
SELECT id, username, email, is_creator, created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- Test newsletter_subscriptions table
SELECT COUNT(*) as total_subscriptions 
FROM public.newsletter_subscriptions;

-- Check categories
SELECT COUNT(*) as total_categories 
FROM public.categories;

-- If any of these queries fail, you need to run the setup SQL files!
