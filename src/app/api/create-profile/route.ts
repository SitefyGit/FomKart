import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

interface CreateProfilePayload {
  id: string
  email: string
  username: string
  full_name: string
  bio?: string
  website?: string
  is_creator?: boolean
  is_verified?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CreateProfilePayload> | null
    const {
      id,
      email,
      username,
      full_name,
      bio,
      website,
      is_creator = true,
      is_verified = false,
    } = body ?? {}

    if (!id || !email || !username || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id,
          email,
          username,
          full_name,
          bio: bio || '',
          website: website || '',
          is_creator: !!is_creator,
          is_verified: !!is_verified,
        },
      ])

    if (error) {
      console.error('create-profile error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('create-profile exception:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
