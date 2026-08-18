import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export async function POST(req: Request) {
  try {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials missing: NEXT_PUBLIC_RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured on Vercel.')
      return NextResponse.json({ 
        error: 'Razorpay API keys (NEXT_PUBLIC_RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are missing in environment variables.' 
      }, { status: 500 })
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })

    const { amount, currency = 'USD' } = await req.json()

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    // Convert amount to sub-units (e.g. cents for USD, paise for INR)
    // Razorpay requires amount in smallest unit (integer).
    const amountInSmallestUnit = Math.round(Number(amount) * 100)

    const options = {
      amount: amountInSmallestUnit,
      currency: currency.toUpperCase(),
      receipt: `receipt_${Date.now()}`,
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json({ order })
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error)
    const message = error?.error?.description || error?.message || 'Error creating Razorpay order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

