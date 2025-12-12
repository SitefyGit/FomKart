import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Server-only admin client using service role key
// Uses lazy initialization to prevent build-time errors
let _supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    // Log warning but don't fail during build
    console.warn('Supabase admin client missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    // Return a dummy client that will fail at runtime with proper errors
    return createClient('https://placeholder.supabase.co', 'placeholder-key')
  }

  _supabaseAdmin = createClient(url, serviceKey)
  return _supabaseAdmin
}

// Export as a getter to allow lazy initialization
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabaseAdmin()
    const value = client[prop as keyof SupabaseClient]
    return typeof value === 'function' ? value.bind(client) : value
  }
})
