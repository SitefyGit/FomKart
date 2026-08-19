import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendBuyerToSellerEmail } from '@/lib/mailer'

/**
 * POST /api/upgrade-to-seller
 * 
 * Upgrades a buyer account to a seller account and sends
 * the buyer→seller congratulations email.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const { user_id } = body

    // Fetch current user data
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('email, full_name, name, username, is_creator')
      .eq('id', user_id)
      .single()

    if (fetchError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.is_creator) {
      return NextResponse.json({ ok: true, message: 'Already a seller', username: user.username })
    }

    // Upgrade to seller
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ is_creator: true })
      .eq('id', user_id)

    if (updateError) {
      console.error('upgrade-to-seller error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Send buyer→seller upgrade email
    const displayName = user.full_name || user.name || user.username || 'Creator'
    await sendBuyerToSellerEmail(user.email, displayName, user.username).catch((err) => {
      console.error('Buyer-to-seller email failed (non-critical):', err)
    })

    return NextResponse.json({ ok: true, username: user.username })
  } catch (error) {
    console.error('upgrade-to-seller exception:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
