# Safe Supabase Migration — Onboarding & Referral Loop

Run these statements one by one in your Supabase SQL Editor (**no tables or data will be deleted**).

---

## 1. Users table — add new columns safely

```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS plan_tier text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
ADD COLUMN IF NOT EXISTS oauth_provider text,
ADD COLUMN IF NOT EXISTS oauth_id text,
ADD COLUMN IF NOT EXISTS theme_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS profile_status text DEFAULT 'onboarding',
ADD COLUMN IF NOT EXISTS custom_branding jsonb DEFAULT NULL;
```

## 2. Users table — indexes for performance

```sql
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_profile_status ON public.users(profile_status);
```

## 3. Referrals table

```sql
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ref_code text,
  ip_address inet,
  user_agent text,
  clicked_at timestamp with time zone DEFAULT now(),
  converted_at timestamp with time zone,
  attribution_source text DEFAULT 'profile_footer',
  status text DEFAULT 'clicked',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
```

## 4. Profile blocks table

```sql
CREATE TABLE IF NOT EXISTS public.profile_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type text CHECK (type IN ('link','product','post','video','divider')),
  content jsonb DEFAULT '{}',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profile_blocks ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_profile_blocks_user ON public.profile_blocks(user_id);
```

## 5. Optional — add RLS policies if you need them

> Only add these if you do **not** already have conflicting policies on `referrals` or `profile_blocks`.

```sql
-- Referrals: allow logged-in users to view their own referral rows
CREATE POLICY IF NOT EXISTS "Users can view own referrals"
  ON public.referrals
  FOR SELECT
  USING (referrer_id = auth.uid());

-- Profile blocks: allow creators to manage their own blocks
CREATE POLICY IF NOT EXISTS "Users can manage own blocks"
  ON public.profile_blocks
  FOR ALL
  USING (user_id = auth.uid());
```

---

## What changed
- **users**: new branding (`theme_color`, `font_family`, `custom_branding`), plan tier (`plan_tier`), referral tracking (`referred_by`, `referral_code`), and onboarding state (`profile_status`).
- **referrals**: stores every click/conversion from the "Powered by Fomkart" footer.
- **profile_blocks**: future-proof content blocks for Beacons-style link pages.

## Rollback notes
If anything breaks, you can drop only the **new** columns/tables:

```sql
-- Only run if you need to undo
ALTER TABLE public.users DROP COLUMN IF EXISTS plan_tier, DROP COLUMN IF EXISTS referred_by, DROP COLUMN IF EXISTS referral_code, DROP COLUMN IF EXISTS oauth_provider, DROP COLUMN IF EXISTS oauth_id, DROP COLUMN IF EXISTS theme_color, DROP COLUMN IF EXISTS font_family, DROP COLUMN IF EXISTS profile_status, DROP COLUMN IF EXISTS custom_branding;
DROP TABLE IF EXISTS public.referrals;
DROP TABLE IF EXISTS public.profile_blocks;
```
