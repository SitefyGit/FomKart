import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { ref_code, attribution_source = 'profile_footer' } = body

    if (!ref_code || typeof ref_code !== 'string') {
      return NextResponse.json(
        { error: 'Missing ref_code' },
        { status: 400 }
      )
    }

    // Find the referrer by username or referral_code
    const { data: referrer, error: referrerError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', ref_code)
      .maybeSingle()

    if (referrerError) {
      console.error('referrals/track referrer lookup error:', referrerError)
      return NextResponse.json(
        { error: 'Lookup failed' },
        { status: 500 }
      )
    }

    if (!referrer) {
      return NextResponse.json(
        { error: 'Referrer not found' },
        { status: 404 }
      )
    }

    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '0.0.0.0'
    const userAgent = request.headers.get('user-agent') ?? null

    const { error } = await supabaseAdmin.from('referrals').insert({
      referrer_id: referrer.id,
      ref_code,
      ip_address: ip,
      user_agent: userAgent,
      attribution_source,
      status: 'clicked',
    })

    if (error) {
      console.error('referrals/track insert error:', error)
      return NextResponse.json(
        { error: 'Failed to track referral' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('referrals/track exception:', err)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
