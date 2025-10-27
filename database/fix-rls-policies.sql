-- Fix RLS Policies for User Creation
-- Run this in your Supabase SQL Editor to fix the signup issue

-- Drop and recreate the users table RLS policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.users;

-- Create more permissive policies for user creation
CREATE POLICY "Anyone can view public user profiles" 
  ON public.users FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to read user data for relationships
CREATE POLICY "Authenticated users can read user data for relationships" 
  ON public.users FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Also ensure the newsletter_subscriptions table allows insertions
DROP POLICY IF EXISTS "Anyone can subscribe to newsletters" ON public.newsletter_subscriptions;
CREATE POLICY "Anyone can subscribe to newsletters" 
  ON public.newsletter_subscriptions FOR INSERT 
  WITH CHECK (true);

-- Ensure creator relationships work
CREATE POLICY "Public can view creator profiles for products" 
  ON public.users FOR SELECT 
  USING (is_creator = true);

-- Refresh the policies
NOTIFY pgrst, 'reload schema';
