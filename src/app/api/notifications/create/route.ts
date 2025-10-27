import { NextResponse } from 'next/server'
import type { PostgrestError } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

interface CreateNotificationPayload {
  user_id: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
}

export async function POST(req: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ ok: false, error: 'Service role not configured' }, { status: 500 })
    }

    const body = (await req.json()) as Partial<CreateNotificationPayload> | null
    const { user_id, type, title, message, data } = body ?? {}

    if (!user_id || !type || !title || !message) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({ user_id, type, title, message, data: data ?? {} })

    if (error) {
      const { message: errorMessage, details } = error as PostgrestError
      return NextResponse.json({ ok: false, error: { message: errorMessage, details } }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
