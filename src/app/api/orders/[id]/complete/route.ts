import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { supabase } from '@/lib/supabase'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split('Bearer ')[1]
    
    // Allow service role or authenticated user
    let userId = null
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id
    }

    // Update order status
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', id)
      .select('id, seller_id, status')
      .single()

    if (orderErr || !order) {
      throw orderErr || new Error('Order not found')
    }

    // Find the pending transaction
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
          .update({ status: 'completed' })
          .eq('id', tx.id)

        // Release funds
        await supabaseAdmin.rpc('release_seller_pending_to_available', {
          p_seller_id: order.seller_id,
          p_amount: tx.amount
        })
      }
    }

    return NextResponse.json({ success: true, order })
  } catch (err: any) {
    console.error('Error completing order:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
