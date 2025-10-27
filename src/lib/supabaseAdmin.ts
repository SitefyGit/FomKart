import { createClient } from '@supabase/supabase-js'

// Server-only admin client using service role key
const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!url || !serviceKey) {
  // Fail fast in development to surface misconfiguration
  console.warn('Supabase admin client missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

export const supabaseAdmin = createClient(url || '', serviceKey || '')
