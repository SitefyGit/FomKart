-- Sample Creator User Data
-- Run this after setting up your main database schema
-- This creates a sample creator account for testing

-- First, you need to create a user through Supabase Auth
-- Go to Authentication > Users in your Supabase dashboard and create a user with:
-- Email: creator@fomkart.com
-- Choose a secure password when creating this user in Supabase Auth
-- Then get the user ID and replace 'YOUR_USER_ID_HERE' below

-- Sample creator profile (replace YOUR_USER_ID_HERE with actual user ID from auth.users)
INSERT INTO public.users (
  id, 
  username, 
  full_name, 
  email, 
  bio, 
  is_creator, 
  is_verified,
  social_links,
  avatar_url,
  background_image
) VALUES (
  'YOUR_USER_ID_HERE', -- Replace with actual user ID from Supabase Auth
  'designpro',
  'Sarah Johnson',
  'creator@fomkart.com',
  'Professional designer creating amazing digital products and websites. 5+ years of experience in UI/UX design.',
  true,
  true,
  '{
    "instagram": "https://instagram.com/designpro",
    "twitter": "https://twitter.com/designpro",
    "youtube": "https://youtube.com/@designpro",
    "website": "https://designpro.com"
  }',
  '/placeholder-avatar.jpg',
  '/api/placeholder/1200/400'
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  bio = EXCLUDED.bio,
  is_creator = EXCLUDED.is_creator,
  is_verified = EXCLUDED.is_verified,
  social_links = EXCLUDED.social_links,
  avatar_url = EXCLUDED.avatar_url,
  background_image = EXCLUDED.background_image;

-- Sample products for the creator
INSERT INTO public.products (
  creator_id,
  category_id,
  title,
  slug,
  description,
  short_description,
  type,
  base_price,
  delivery_time,
  revisions,
  features,
  requirements,
  images,
  tags,
  status,
  is_digital,
  is_featured
) VALUES 
-- Product 1: Website Design
(
  'YOUR_USER_ID_HERE', -- Replace with actual user ID
  (SELECT id FROM public.categories WHERE slug = 'graphics-design' LIMIT 1),
  'Custom Website Design',
  'custom-website-design',
  'Professional website design tailored to your business needs. I create modern, responsive websites that convert visitors into customers.',
  'Modern, responsive website design',
  'service',
  150.00,
  7,
  3,
  ARRAY['Custom Design', 'Mobile Responsive', 'SEO Optimized', 'Source Files'],
  ARRAY['Business Description', 'Logo/Branding Assets', 'Content (Text & Images)', 'Color Preferences'],
  ARRAY['/placeholder-product.jpg'],
  ARRAY['website', 'design', 'responsive', 'modern'],
  'active',
  true,
  true
),
-- Product 2: Logo Design
(
  'YOUR_USER_ID_HERE', -- Replace with actual user ID
  (SELECT id FROM public.categories WHERE slug = 'graphics-design' LIMIT 1),
  'Professional Logo Design',
  'professional-logo-design',
  'Get a unique, professional logo that represents your brand perfectly. Includes multiple concepts and unlimited revisions.',
  'Unique professional logo design',
  'service',
  75.00,
  3,
  5,
  ARRAY['Multiple Concepts', 'Unlimited Revisions', 'Vector Files', 'Brand Guidelines'],
  ARRAY['Business Name', 'Industry/Niche', 'Style Preferences', 'Color Preferences'],
  ARRAY['/placeholder-product.jpg'],
  ARRAY['logo', 'branding', 'identity', 'design'],
  'active',
  true,
  false
),
-- Product 3: UI/UX Design
(
  'YOUR_USER_ID_HERE', -- Replace with actual user ID
  (SELECT id FROM public.categories WHERE slug = 'graphics-design' LIMIT 1),
  'Mobile App UI/UX Design',
  'mobile-app-ui-ux-design',
  'Complete mobile app design including user research, wireframes, and high-fidelity mockups. Perfect for startups and businesses.',
  'Complete mobile app design',
  'service',
  300.00,
  14,
  2,
  ARRAY['User Research', 'Wireframes', 'High-Fidelity Mockups', 'Prototype', 'Design System'],
  ARRAY['App Concept', 'Target Audience', 'Platform (iOS/Android)', 'Feature List'],
  ARRAY['/placeholder-product.jpg'],
  ARRAY['mobile', 'app', 'ui', 'ux', 'design'],
  'active',
  true,
  false
);

-- Sample product packages for the website design product
INSERT INTO public.product_packages (
  product_id,
  name,
  description,
  price,
  delivery_time,
  revisions,
  features,
  is_popular,
  sort_order
) VALUES 
-- Basic Package
(
  (SELECT id FROM public.products WHERE slug = 'custom-website-design' LIMIT 1),
  'Basic',
  'Perfect for personal projects and small businesses',
  150.00,
  3,
  1,
  ARRAY['1-3 Pages', 'Mobile Responsive', 'Basic SEO', '1 Revision Round'],
  false,
  1
),
-- Standard Package (Most Popular)
(
  (SELECT id FROM public.products WHERE slug = 'custom-website-design' LIMIT 1),
  'Standard',
  'Most popular choice for growing businesses',
  300.00,
  5,
  3,
  ARRAY['4-7 Pages', 'Mobile & Tablet Responsive', 'Advanced SEO', '3 Revision Rounds', 'Contact Forms'],
  true,
  2
),
-- Premium Package
(
  (SELECT id FROM public.products WHERE slug = 'custom-website-design' LIMIT 1),
  'Premium',
  'Complete solution for established businesses',
  500.00,
  7,
  5,
  ARRAY['8-15 Pages', 'Advanced Animations', 'E-commerce Integration', '5 Revision Rounds', 'Performance Optimization', 'Analytics Setup'],
  false,
  3
);

-- Sample newsletter subscriptions (optional)
INSERT INTO public.newsletter_subscriptions (
  email,
  creator_id,
  name,
  preferences,
  source,
  status,
  confirmed
) VALUES 
(
  'subscriber1@example.com',
  'YOUR_USER_ID_HERE', -- Replace with actual user ID
  'John Doe',
  '{"interests": ["design", "web-development"], "frequency": "weekly"}',
  'creator_page',
  'active',
  true
),
(
  'subscriber2@example.com',
  'YOUR_USER_ID_HERE', -- Replace with actual user ID
  'Jane Smith',
  '{"interests": ["branding", "logo-design"], "frequency": "monthly"}',
  'lead_form',
  'active',
  true
);

-- Instructions:
-- 1. Create a user in Supabase Auth dashboard with email: creator@fomkart.com and set your own secure password
-- 2. Copy the user ID from the auth.users table
-- 3. Replace all instances of 'YOUR_USER_ID_HERE' with the actual user ID
-- 4. Run this SQL in your Supabase SQL Editor
-- 5. You can now log in as a creator and test the full functionality!
