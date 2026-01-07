-- Fix infinite recursion in admin_users RLS policies

-- 1. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Super admins have full access to admin_users" ON public.admin_users;

-- 2. Create a secure function to check super admin status
-- SECURITY DEFINER allows this function to bypass RLS, preventing recursion
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.admin_users 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the policy using the secure function
CREATE POLICY "Super admins have full access to admin_users" ON public.admin_users
    FOR ALL USING (
        public.check_is_super_admin()
    );

-- 4. Also fix the generic is_admin check to be safe
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.admin_users 
        WHERE user_id = auth.uid() 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
