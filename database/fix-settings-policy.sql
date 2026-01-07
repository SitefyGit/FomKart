-- Fix missing write policy for site_settings

-- Allow admins to manage site settings (INSERT, UPDATE, DELETE)
-- This was missing, causing "Failed to save settings" error
CREATE POLICY "Admins can manage site settings" ON public.site_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );
