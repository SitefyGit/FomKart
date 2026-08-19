import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/mailer'

/**
 * GET /api/test-email?to=test@example.com
 * 
 * Debug endpoint to test if MailerSend is working.
 * Returns detailed error info if it fails.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const to = searchParams.get('to')

  if (!to) {
    return NextResponse.json({ error: 'Pass ?to=your@email.com' }, { status: 400 })
  }

  // Check env vars
  const apiKey = process.env.MAILERSEND_API_KEY
  const fromEmail = process.env.MAILERSEND_FROM_EMAIL

  const diagnostics: Record<string, any> = {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING',
    fromEmail: fromEmail || 'MISSING (will default to no-reply@fomkart.com)',
    toEmail: to,
    timestamp: new Date().toISOString(),
  }

  try {
    const result = await sendEmail({
      to,
      toName: 'Test User',
      subject: 'FomKart Email Test ✅',
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;">
          <h2>Email Test Successful!</h2>
          <p>If you're reading this, MailerSend is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
          <pre>${JSON.stringify(diagnostics, null, 2)}</pre>
        </div>
      `,
      text: `Email test successful! Sent at ${new Date().toISOString()}`,
    })

    return NextResponse.json({
      success: result,
      message: result ? 'Email sent successfully!' : 'sendEmail returned false — check server logs for [mailer] errors',
      diagnostics,
    })
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      stack: err.stack,
      diagnostics,
    }, { status: 500 })
  }
}
