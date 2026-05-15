import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * POST /api/auth/register
 * 
 * Creates a Supabase Auth user + public.users row in one go.
 * Accepts optional referralCode to link the referred_by field.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const {
      email,
      password,
      username,
      full_name,
      referralCode,
      theme_color = '#000000',
      font_family = 'Inter',
    } = body

    // ── Validate required fields ──
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'email, password, and username are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const slug = username.trim().toLowerCase()
    if (slug.length < 3 || slug.length > 30 || !/^[a-z0-9_-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      )
    }

    // ── Check username availability ──
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', slug)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      )
    }

    // ── Resolve referrer ──
    let referredBy: string | null = null
    if (referralCode && typeof referralCode === 'string') {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', referralCode.trim().toLowerCase())
        .maybeSingle()

      if (referrer) {
        referredBy = referrer.id
      }
    }

    // ── Create Supabase Auth user ──
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      console.error('auth.admin.createUser error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Failed to create auth user' },
        { status: 400 }
      )
    }

    // ── Create public.users row ──
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        username: slug,
        full_name: full_name || slug,
        bio: '',
        website: '',
        is_creator: true,
        is_verified: false,
        plan_tier: 'free',
        referred_by: referredBy,
        referral_code: slug, // Use username as referral code
        theme_color,
        font_family,
        profile_status: 'active',
      })

    if (profileError) {
      console.error('create user row error:', profileError)
      // Best effort: delete the orphaned auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => {})
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

    // ── Convert referral row if one exists ──
    if (referredBy && referralCode) {
      try {
        await supabaseAdmin
          .from('referrals')
          .update({
            referred_id: authData.user.id,
            converted_at: new Date().toISOString(),
            status: 'converted',
          })
          .eq('ref_code', referralCode.trim().toLowerCase())
          .eq('status', 'clicked')
          .order('clicked_at', { ascending: false })
          .limit(1)
      } catch {
        // Best-effort: referral conversion is not critical
      }
    }

    return NextResponse.json({
      ok: true,
      userId: authData.user.id,
      username: slug,
    })
  } catch (err) {
    console.error('register exception:', err)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
