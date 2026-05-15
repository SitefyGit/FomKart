import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')?.trim().toLowerCase()

    if (!slug || slug.length < 3 || slug.length > 30) {
      return NextResponse.json(
        { available: false, reason: 'invalid_length' },
        { status: 400 }
      )
    }

    // Allow only alphanumeric, hyphens, underscores
    if (!/^[a-z0-9_-]+$/.test(slug)) {
      return NextResponse.json(
        { available: false, reason: 'invalid_chars' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', slug)
      .maybeSingle()

    if (error) {
      console.error('check-username error:', error)
      return NextResponse.json(
        { available: false, reason: 'server_error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ available: !data })
  } catch (err) {
    console.error('check-username exception:', err)
    return NextResponse.json(
      { available: false, reason: 'server_error' },
      { status: 500 }
    )
  }
}
