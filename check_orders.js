import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrders() {
  const orderIds = ['ORD-1781253398172-3203E', 'ORD-1780758125282-RSUUK']
  
  for (const id of orderIds) {
    const { data: order } = await supabase.from('orders').select('id, status').eq('id', id).single()
    console.log(`Order ${id}:`, order?.status)

    const { data: txs } = await supabase.from('wallet_transactions').select('id, status, amount, transaction_type').eq('order_id', id)
    console.log(`Transactions for ${id}:`, txs)
  }
}

checkOrders()
