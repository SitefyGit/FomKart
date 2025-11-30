import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { orderId, creatorId, message } = await request.json()

    if (!orderId || !creatorId || !message) {
      return NextResponse.json({ error: 'Missing orderId, creatorId, or message' }, { status: 400 })
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, seller_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.seller_id !== creatorId) {
      return NextResponse.json({ error: 'Creator mismatch' }, { status: 403 })
    }

    const { error: insertError } = await supabaseAdmin.from('order_messages').insert({
      order_id: orderId,
      sender_id: creatorId,
      message,
      is_system_message: true
    })

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Auto message service error', error)
    return NextResponse.json({ error: 'Failed to create auto message' }, { status: 500 })
  }
}
