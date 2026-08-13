import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendNewsletterBroadcast } from '@/lib/mailer'

export async function POST(request: Request) {
  try {
    const { creatorId, subject, content, targetPreferences } = await request.json()

    if (!creatorId || !subject || !content) {
      return NextResponse.json(
        { error: 'creatorId, subject, and content are required' },
        { status: 400 }
      )
    }

    // Get active subscribers for this creator
    const { data: subscribers, error: subError } = await supabaseAdmin
      .from('newsletter_subscriptions')
      .select('email, name, preferences')
      .eq('creator_id', creatorId)
      .eq('status', 'active')

    if (subError) {
      console.error('Failed to fetch subscribers:', subError)
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 })
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    // Filter by preferences if specified
    let targetSubscribers = subscribers
    if (targetPreferences && Array.isArray(targetPreferences) && targetPreferences.length > 0) {
      targetSubscribers = subscribers.filter((sub: any) => {
        const interests = sub.preferences?.interests || []
        return interests.some((interest: string) => targetPreferences.includes(interest))
      })
    }

    // Send emails in parallel (batches of 10 to avoid overwhelming the API)
    let sentCount = 0
    const batchSize = 10

    for (let i = 0; i < targetSubscribers.length; i += batchSize) {
      const batch = targetSubscribers.slice(i, i + batchSize)
      const results = await Promise.allSettled(
        batch.map((sub: any) =>
          sendNewsletterBroadcast(sub.email, sub.name, subject, content)
        )
      )

      sentCount += results.filter((r) => r.status === 'fulfilled' && r.value === true).length
    }

    console.log(`[newsletter] Sent ${sentCount}/${targetSubscribers.length} emails for creator ${creatorId}`)

    return NextResponse.json({ success: true, sent: sentCount })
  } catch (error) {
    console.error('Newsletter send error:', error)
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    )
  }
}
