import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase
    .from('settlements')
    .select('*, users!seller_id(username, full_name, email)')
    .limit(1)

  console.log('With !seller_id:', error)

  const { data: d2, error: e2 } = await supabase
    .from('settlements')
    .select('*, users(username, full_name, email)')
    .limit(1)

  console.log('Without !seller_id:', e2)
}

test()
