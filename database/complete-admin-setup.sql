-- 1. SETUP ADMIN SCHEMA
-- Admin roles enum type
DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'moderator', 'support');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role admin_role NOT NULL DEFAULT 'moderator',
    permissions JSONB DEFAULT '{
        "categories": {"create": false, "read": true, "update": false, "delete": false},
        "users": {"create": false, "read": true, "update": false, "delete": false, "verify": false, "ban": false},
        "products": {"create": false, "read": true, "update": false, "delete": false, "approve": false},
        "orders": {"read": true, "update": false, "refund": false},
        "analytics": {"read": false},
        "settings": {"read": false, "update": false}
    }'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Admin activity log
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Site settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    updated_by UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Featured sections
CREATE TABLE IF NOT EXISTS public.featured_sections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('products', 'categories', 'creators', 'custom')),
    items UUID[] DEFAULT '{}',
    settings JSONB DEFAULT '{
        "title": "",
        "subtitle": "",
        "max_items": 8,
        "layout": "grid",
        "show_on_homepage": true
    }'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reporter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'user', 'review', 'message')),
    entity_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN (
        'spam', 'inappropriate', 'fraud', 'copyright', 
        'harassment', 'misleading', 'quality', 'other'
    )),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    handled_by UUID REFERENCES public.admin_users(id),
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'buyers', 'sellers', 'admins')),
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ends_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add columns to existing tables
DO $$ 
BEGIN
    -- Categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'icon') THEN
        ALTER TABLE public.categories ADD COLUMN icon TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'meta_title') THEN
        ALTER TABLE public.categories ADD COLUMN meta_title TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'meta_description') THEN
        ALTER TABLE public.categories ADD COLUMN meta_description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_featured') THEN
        ALTER TABLE public.categories ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;

    -- Products
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'moderation_status') THEN
        ALTER TABLE public.products ADD COLUMN moderation_status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'moderation_notes') THEN
        ALTER TABLE public.products ADD COLUMN moderation_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'moderated_by') THEN
        ALTER TABLE public.products ADD COLUMN moderated_by UUID REFERENCES public.admin_users(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'moderated_at') THEN
        ALTER TABLE public.products ADD COLUMN moderated_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Users
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_banned') THEN
        ALTER TABLE public.users ADD COLUMN is_banned BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'ban_reason') THEN
        ALTER TABLE public.users ADD COLUMN ban_reason TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'banned_at') THEN
        ALTER TABLE public.users ADD COLUMN banned_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'banned_by') THEN
        ALTER TABLE public.users ADD COLUMN banned_by UUID REFERENCES public.admin_users(id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
    CREATE POLICY "Admin users can view their own record" ON public.admin_users FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Super admins have full access to admin_users" ON public.admin_users FOR ALL USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND role = 'super_admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can read site settings" ON public.site_settings FOR SELECT USING (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid() AND is_active = true));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. ENSURE USER EXISTS IN PUBLIC.USERS
INSERT INTO public.users (id, email, username, full_name, avatar_url)
VALUES (
    'fa791bcb-c84a-416c-bca3-ef283d9a5a8a',
    'rkrizkhan321@gmail.com',
    'zulrizvi',
    'Zulqarnain Rizvi',
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name;

-- 3. MAKE USER ADMIN
INSERT INTO public.admin_users (user_id, role, permissions)
VALUES (
    'fa791bcb-c84a-416c-bca3-ef283d9a5a8a',
    'super_admin',
    '{"all": true}'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
    role = 'super_admin',
    permissions = '{"all": true}'::jsonb,
    is_active = true;
