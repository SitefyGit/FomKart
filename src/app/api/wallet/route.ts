import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split('Bearer ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get wallet
    let { data: wallet } = await supabaseAdmin
      .from('seller_wallets')
      .select('*')
      .eq('seller_id', user.id)
      .maybeSingle()

    // If wallet doesn't exist, create it (fallback if trigger failed)
    if (!wallet) {
      const { data: newWallet, error } = await supabaseAdmin
        .from('seller_wallets')
        .insert([{ seller_id: user.id, currency: 'USD' }])
        .select()
        .single()
      
      if (error) throw error
      wallet = newWallet
    }

    // Get transactions
    const { data: transactions } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*, orders(order_number)')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Get settlements
    const { data: settlements } = await supabaseAdmin
      .from('settlements')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ wallet, transactions, settlements })
  } catch (error: any) {
    console.error('Error fetching wallet:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split('Bearer ')[1]
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, payoutMethod, payoutDetails } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Get wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('seller_wallets')
      .select('*')
      .eq('seller_id', user.id)
      .maybeSingle()

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    if (wallet.available_balance < amount) {
      return NextResponse.json({ error: 'Insufficient available balance' }, { status: 400 })
    }

    // 1. Create settlement request
    const { data: settlement, error: settlementError } = await supabaseAdmin
      .from('settlements')
      .insert([{
        seller_id: user.id,
        amount,
        currency: wallet.currency || 'USD',
        status: 'pending',
        payout_method: payoutMethod,
        payout_details: payoutDetails
      }])
      .select()
      .single()

    if (settlementError) throw settlementError

    // 2. Deduct from available balance
    const newAvailable = wallet.available_balance - amount
    await supabaseAdmin
      .from('seller_wallets')
      .update({ available_balance: newAvailable })
      .eq('id', wallet.id)

    // 3. Log transaction
    await supabaseAdmin
      .from('wallet_transactions')
      .insert([{
        wallet_id: wallet.id,
        transaction_type: 'withdrawal',
        amount: -amount, // debit
        status: 'pending',
        description: `Withdrawal request via ${payoutMethod}`
      }])

    return NextResponse.json({ success: true, settlement })
  } catch (error: any) {
    console.error('Error creating settlement:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
