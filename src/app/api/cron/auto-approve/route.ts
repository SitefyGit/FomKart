import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const now = new Date().toISOString()
    
    // Find orders that are 'delivered' and the approval deadline has passed
    const { data: expiredOrders, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, buyer_id, seller_id, approve_by, order_number')
      .eq('status', 'delivered')
      .lt('approve_by', now)

    if (fetchError) {
      console.error('Error fetching expired orders:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const processedIds: string[] = []

    for (const order of (expiredOrders || [])) {
      // Update status to completed
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id)

      if (updateError) {
        console.error(`Failed to auto-approve order ${order.id}:`, updateError)
        continue
      }

      processedIds.push(order.id)
      const orderShort = order.order_number || order.id.substring(0, 8)

      // 1. Add system message
      await supabaseAdmin.from('order_messages').insert({
        order_id: order.id,
        // using seller_id as sender is common context, or just leave it null if constrained, but system message usually needs a sender?
        // Checking page.tsx, it renders based on is_system_message=true. 
        // We'll use seller_id if available as the "executor" essentially, or null if schema allows.
        // Usually safer to pick one participant. Let's pick seller_id.
        sender_id: order.seller_id, 
        message: 'Order automatically approved by system (3 days passed)',
        is_system_message: true
      })

      // 2. Notify Buyer
      if (order.buyer_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: order.buyer_id,
          type: 'order_completed',
          title: 'Order Completed',
          message: `Order #${orderShort} was automatically approved.`,
          data: { order_id: order.id }
        })
      }

      // 3. Notify Seller
      if (order.seller_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: order.seller_id,
          type: 'order_completed',
          title: 'Order Completed',
          message: `Order #${orderShort} has been automatically approved. Funds are now available.`,
          data: { order_id: order.id }
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed_count: processedIds.length, 
      processed: processedIds 
    })

  } catch (error) {
    console.error('Auto-approve cron job failed:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
