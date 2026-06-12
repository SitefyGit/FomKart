import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    // Find all completed orders
    const { data: completedOrders, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, seller_id')
      .eq('status', 'completed')

    if (orderErr) throw orderErr

    let fixedCount = 0

    for (const order of completedOrders) {
      // Find pending wallet_transactions for this order
      const { data: pendingTxs } = await supabaseAdmin
        .from('wallet_transactions')
        .select('*')
        .eq('order_id', order.id)
        .eq('transaction_type', 'credit')
        .eq('status', 'pending')

      if (pendingTxs && pendingTxs.length > 0) {
        for (const tx of pendingTxs) {
          // Mark transaction as completed
          await supabaseAdmin
            .from('wallet_transactions')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', tx.id)

          // Call RPC to release funds
          await supabaseAdmin.rpc('release_seller_pending_to_available', {
            p_seller_id: order.seller_id,
            p_amount: tx.amount
          })
          
          fixedCount++
        }
      }
    }

    return NextResponse.json({ success: true, fixedCount, message: `Fixed ${fixedCount} pending transactions for completed orders.` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
