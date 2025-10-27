-- Add additional fields to users table for enhanced creator profiles
-- Run this in Supabase SQL Editor after the main setup

-- Add social media URL columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS youtube_url text,
ADD COLUMN IF NOT EXISTS subscription_enabled boolean default true;

-- Update existing RLS policies to allow profile updates
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users 
  FOR UPDATE USING (auth.uid() = id);

-- Add policy for profile picture and background updates
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Ensure creator profiles are publicly viewable
DROP POLICY IF EXISTS "Creator profiles are publicly viewable" ON public.users;
CREATE POLICY "Creator profiles are publicly viewable" ON public.users 
  FOR SELECT USING (is_creator = true);

-- Update users table to include email field from auth
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email = NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
