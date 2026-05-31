import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
  try {
    const { sender_id, receiver_id, content } = await request.json()

    if (!sender_id || !receiver_id || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Determine participant1 and participant2 consistently to avoid duplicates
    const p1 = sender_id < receiver_id ? sender_id : receiver_id
    const p2 = sender_id < receiver_id ? receiver_id : sender_id

    // Check if conversation exists
    let { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('participant1_id', p1)
      .eq('participant2_id', p2)
      .single()

    // If it doesn't exist, create it
    if (!conversation) {
      const { data: newConv, error: newConvError } = await supabaseAdmin
        .from('conversations')
        .insert({
          participant1_id: p1,
          participant2_id: p2,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (newConvError) {
        console.error('Create conversation error', newConvError)
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      }
      conversation = newConv
    } else {
      // Update the updated_at timestamp
      await supabaseAdmin
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id)
    }

    // Insert the direct message
    const { error: msgError } = await supabaseAdmin
      .from('direct_messages')
      .insert({
        conversation_id: conversation!.id,
        sender_id: sender_id,
        content: content
      })

    if (msgError) {
      console.error('Insert message error', msgError)
      return NextResponse.json({ error: 'Failed to insert message' }, { status: 500 })
    }

    // Insert Notification for the receiver
    const { error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: receiver_id,
        type: 'direct_message',
        title: 'New Message',
        message: 'You have received a new direct message.',
        data: { conversation_id: conversation!.id }
      })

    if (notifError) {
      console.warn('Failed to insert notification', notifError)
    }

    return NextResponse.json({ success: true, conversation_id: conversation!.id })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

