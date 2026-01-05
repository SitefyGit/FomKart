-- Admin Dashboard Schema for FomKart
-- This adds admin functionality including role-based access control

-- Admin roles enum type
DO $$ BEGIN
    CREATE TYPE admin_role AS ENUM ('super_admin', 'admin', 'moderator', 'support');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Admin users table - extends the users table with admin privileges
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

-- Admin activity log for audit trail
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject', 'ban', 'verify', etc.
    entity_type TEXT NOT NULL, -- 'category', 'user', 'product', 'order', etc.
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb, -- Additional context about the action
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Site settings table for admin configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general', -- 'general', 'payments', 'notifications', 'seo', etc.
    updated_by UUID REFERENCES public.admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Featured sections for homepage customization
CREATE TABLE IF NOT EXISTS public.featured_sections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('products', 'categories', 'creators', 'custom')),
    items UUID[] DEFAULT '{}', -- Array of product/category/user IDs
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

-- Reported content table for moderation
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

-- Platform announcements
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

-- Add admin-related columns to categories if not exists
DO $$ 
BEGIN
    -- Add icon column for category icons
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'icon') THEN
        ALTER TABLE public.categories ADD COLUMN icon TEXT;
    END IF;
    
    -- Add metadata for SEO
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'meta_title') THEN
        ALTER TABLE public.categories ADD COLUMN meta_title TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'meta_description') THEN
        ALTER TABLE public.categories ADD COLUMN meta_description TEXT;
    END IF;
    
    -- Add featured flag
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_featured') THEN
        ALTER TABLE public.categories ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add moderation columns to products
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'moderation_status') THEN
        ALTER TABLE public.products ADD COLUMN moderation_status TEXT DEFAULT 'pending' 
            CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'under_review'));
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
END $$;

-- Add ban/suspend columns to users
DO $$ 
BEGIN
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON public.admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_entity ON public.admin_activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created ON public.admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_entity ON public.reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_products_moderation ON public.products(moderation_status);

-- RLS Policies for admin tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Admin users can read their own record
CREATE POLICY "Admin users can view their own record" ON public.admin_users
    FOR SELECT USING (auth.uid() = user_id);

-- Super admins can do everything
CREATE POLICY "Super admins have full access to admin_users" ON public.admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

-- Activity log - admins can insert their own logs
CREATE POLICY "Admins can insert activity logs" ON public.admin_activity_log
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Admins can read all activity logs
CREATE POLICY "Admins can read activity logs" ON public.admin_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Site settings - admins can read
CREATE POLICY "Admins can read site settings" ON public.site_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Featured sections - public read, admin write
CREATE POLICY "Anyone can read active featured sections" ON public.featured_sections
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage featured sections" ON public.featured_sections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Reports - users can create, admins can manage
CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.reports
    FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage reports" ON public.reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Announcements - public read active, admin write
CREATE POLICY "Anyone can read active announcements" ON public.announcements
    FOR SELECT USING (
        is_active = true 
        AND (starts_at IS NULL OR starts_at <= now()) 
        AND (ends_at IS NULL OR ends_at >= now())
    );

CREATE POLICY "Admins can manage announcements" ON public.announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Insert default site settings
INSERT INTO public.site_settings (key, value, description, category) VALUES
    ('site_name', '"FomKart"', 'Name of the marketplace', 'general'),
    ('site_tagline', '"Your Creative Marketplace"', 'Site tagline/slogan', 'general'),
    ('platform_fee', '10', 'Platform fee percentage on each sale', 'payments'),
    ('min_withdrawal', '50', 'Minimum withdrawal amount', 'payments'),
    ('auto_approve_products', 'false', 'Auto-approve new product listings', 'moderation'),
    ('require_identity_verification', 'true', 'Require sellers to verify identity', 'moderation'),
    ('max_gigs_free', '4', 'Maximum gigs for free tier sellers', 'limits'),
    ('max_gigs_pro', '10', 'Maximum gigs for pro tier sellers', 'limits'),
    ('max_gigs_premium', '30', 'Maximum gigs for premium tier sellers', 'limits')
ON CONFLICT (key) DO NOTHING;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = user_uuid AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
    user_role admin_role;
BEGIN
    SELECT role INTO user_role FROM public.admin_users 
    WHERE user_id = user_uuid AND is_active = true;
    RETURN user_role::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION public.log_admin_activity(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_admin_id UUID;
    v_log_id UUID;
BEGIN
    SELECT id INTO v_admin_id FROM public.admin_users WHERE user_id = auth.uid();
    
    INSERT INTO public.admin_activity_log (admin_id, action, entity_type, entity_id, details)
    VALUES (v_admin_id, p_action, p_entity_type, p_entity_id, p_details)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.admin_users IS 'Admin users with role-based access control';
COMMENT ON TABLE public.admin_activity_log IS 'Audit log of all admin actions';
COMMENT ON TABLE public.site_settings IS 'Platform-wide configuration settings';
COMMENT ON TABLE public.featured_sections IS 'Customizable featured sections for homepage';
COMMENT ON TABLE public.reports IS 'User-reported content for moderation';
COMMENT ON TABLE public.announcements IS 'Platform announcements and notifications';
