import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, name, creatorId, preferences, source } = await request.json()

    // Basic validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // If creatorId is missing, we might want to use a default or handle it.
    // For now, we'll proceed. If the DB requires it, it will fail and we catch it.
    // Assuming there is a 'platform' creator or we can insert null if allowed.
    // If the table has a foreign key constraint on creator_id, we must provide a valid UUID.
    // Since we don't have a guaranteed ID, we will try to insert.
    
    const payload: any = {
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        preferences: preferences ? { interests: preferences } : {},
        source: source || 'api',
        tags: preferences || [],
        status: 'active',
        confirmed: false,
    }
    
    if (creatorId) {
        payload.creator_id = creatorId
    } else {
        // Try to find a default 'fomkart' user or similar if needed, 
        // or just omit it if the DB allows null.
        // If DB requires it, this insert will fail.
        // Let's try to fetch a system user if possible, or just let it fail/succeed based on schema.
        // For this fix, we'll assume the schema allows null or we just don't send it.
    }

    // Insert or update newsletter subscription
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .upsert(payload, {
        onConflict: creatorId ? 'email,creator_id' : 'email' // Adjust conflict target if needed
      })
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      )
    }

    // In a production app, you would also:
    // 1. Send a confirmation email
    // 2. Add to your email marketing service (Mailchimp, ConvertKit, etc.)
    // 3. Track the subscription event in analytics
    // 4. Generate a confirmation token

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: data?.[0]
    })

  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve newsletter subscribers (for creators)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get('creatorId')
    const status = searchParams.get('status') || 'active'

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscribers: data,
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Newsletter fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
