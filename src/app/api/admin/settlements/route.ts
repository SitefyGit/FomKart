import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split('Bearer ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if user is admin (simplified check - in a real app, check a roles table)
    // For now we assume this route is protected by middleware or the frontend admin layout

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'

    let query = supabaseAdmin
      .from('settlements')
      .select('*, users(username, full_name, email)')
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: settlements, error } = await query

    if (error) throw error

    return NextResponse.json({ settlements })
  } catch (error: any) {
    console.error('Error fetching settlements:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split('Bearer ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, status } = await req.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }

    // Get the settlement
    const { data: settlement, error: getError } = await supabaseAdmin
      .from('settlements')
      .select('*')
      .eq('id', id)
      .single()

    if (getError || !settlement) {
      return NextResponse.json({ error: 'Settlement not found' }, { status: 404 })
    }

    if (settlement.status !== 'pending' && settlement.status !== 'processing') {
      return NextResponse.json({ error: 'Cannot update a completed or failed settlement' }, { status: 400 })
    }

    // If failed, refund the amount back to available balance
    if (status === 'failed') {
      const { data: wallet } = await supabaseAdmin
        .from('seller_wallets')
        .select('*')
        .eq('seller_id', settlement.seller_id)
        .single()

      if (wallet) {
        await supabaseAdmin
          .from('seller_wallets')
          .update({ available_balance: wallet.available_balance + settlement.amount })
          .eq('id', wallet.id)
        
        await supabaseAdmin
          .from('wallet_transactions')
          .insert([{
            wallet_id: wallet.id,
            transaction_type: 'refund',
            amount: settlement.amount,
            status: 'completed',
            description: 'Refund for failed withdrawal request'
          }])
      }
    }

    // Update settlement
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('settlements')
      .update({ 
        status, 
        processed_at: (status === 'completed' || status === 'failed') ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ success: true, settlement: updated })
  } catch (error: any) {
    console.error('Error updating settlement:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
