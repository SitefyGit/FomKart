import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendOrderConfirmationBuyer, sendNewOrderSeller } from '@/lib/mailer'

export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      items, 
      buyer_id, 
      billing_info, 
      payment_method,
      currency
    } = await req.json()

    // 1. Verify the signature
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      console.error('RAZORPAY_KEY_SECRET is not configured on Vercel.')
      return NextResponse.json({ error: 'Server configuration error: missing Razorpay secret key.' }, { status: 500 })
    }

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex')

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid physical signature' }, { status: 400 })
    }

    // 2. Fetch the commission rate
    const { data: settings } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'commission_rate')
      .single()

    const commissionRate = settings?.value ? parseFloat(settings.value) : 20;

    // 3. Create orders safely in the database
    const orderPromises = items.map(async (item: any) => {
      const selectedPackage = item.package
      if (!selectedPackage || !item.product) {
        throw new Error('Invalid item data')
      }

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      const subtotal = selectedPackage.price * item.quantity
      
      // As per Fomkart plan, Commission is deducted from the total payment. 
      // i.e., Buyer pays Subtotal. Platform takes Commission%. Seller gets remainder.
      const total = subtotal
      const serviceFee = Math.round(total * (commissionRate / 100) * 100) / 100
      
      const deliveryDays = selectedPackage.delivery_time ?? selectedPackage.delivery_days ?? 5
      const expectedDelivery = new Date()
      expectedDelivery.setDate(expectedDelivery.getDate() + deliveryDays)

      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .insert([{
          order_number: orderNumber,
          buyer_id: buyer_id,
          seller_id: item.product.creator_id,
          product_id: item.productId,
          package_id: item.packageId,
          quantity: item.quantity,
          unit_price: selectedPackage.price,
          total_price: total,
          service_fee: serviceFee,
          status: 'confirmed',
          payment_status: 'completed',
          payment_method: payment_method,
          transaction_id: razorpay_payment_id,
          expected_delivery: expectedDelivery.toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      // Update seller wallet (remaining amount)
      const sellerEarnedAmount = total - serviceFee;
      
      // Upsert transaction
      const { error: txError } = await supabaseAdmin
        .from('wallet_transactions')
        .insert([{
            wallet_id: (await supabaseAdmin.from('seller_wallets').select('id').eq('seller_id', item.product.creator_id).single()).data?.id,
            order_id: order.id,
            transaction_type: 'credit',
            amount: sellerEarnedAmount,
            status: 'pending',
            description: `Payment for order ${orderNumber}`
        }]);

      if (!txError) {
          // Add to pending balance for escrow period
          await supabaseAdmin.rpc('increment_seller_pending_balance', {
             p_seller_id: item.product.creator_id,
             p_amount: sellerEarnedAmount
          });
      }

      
      // Auto-deliver digital items
      if (item.product.is_digital && item.product.auto_deliver) {
        // Log auto delivery logic if needed
      }

      return order
    })

    const orders = await Promise.all(orderPromises)

    // Clear cart (using service role to bypass RLS, or let frontend do it)
    await supabaseAdmin
      .from('carts')
      .delete()
      .eq('user_id', buyer_id)

    // ── Send order emails (awaited so they complete before response on serverless) ──
    try {
      const { data: buyerUser } = await supabaseAdmin
        .from('users')
        .select('email, full_name, username')
        .eq('id', buyer_id)
        .single()

      if (buyerUser?.email) {
        const emailPromises: Promise<any>[] = []

        for (const order of orders) {
          const item = items.find((i: any) => i.productId === order.product_id)
          const productTitle = item?.product?.title || 'Your product'
          const total = order.total_price || 0

          // Format price with correct currency (defaulting to USD if none provided)
          const displayCurrency = currency || 'USD'
          // We convert from USD (base) to displayCurrency. If they are the same, it's 1:1.
          // Note: The UI calculates totalAmountLocal for Razorpay, but for emails we can just format it nicely.
          // Actually, we don't have the conversion rate on backend easily without importing `convertFromUSD`. 
          // But we can just import it! Wait, can we? Let's just use the `Intl.NumberFormat` with the appropriate conversion if needed, 
          // OR simply, if the currency is INR, multiply by 84.5. Since we don't have currency.ts imported here, let's just do a basic switch 
          // or import `convertFromUSD` from `@/lib/currency`.

          // Buyer confirmation
          emailPromises.push(
            (async () => {
              const { convertFromUSD } = await import('@/lib/currency')
              const localTotal = convertFromUSD(total, displayCurrency)
              const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: displayCurrency }).format(localTotal)

              await sendOrderConfirmationBuyer(
                buyerUser.email,
                buyerUser.full_name || buyerUser.username || 'Customer',
                order.order_number,
                productTitle,
                formattedTotal
              )
            })()
          )

          // Seller notification
          if (order.seller_id) {
            emailPromises.push(
              (async () => {
                const { convertFromUSD } = await import('@/lib/currency')
                const localTotal = convertFromUSD(total, displayCurrency)
                const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: displayCurrency }).format(localTotal)

                const { data: sellerUser } = await supabaseAdmin
                  .from('users')
                  .select('email, full_name, username')
                  .eq('id', order.seller_id)
                  .single()

                if (sellerUser?.email) {
                  await sendNewOrderSeller(
                    sellerUser.email,
                    sellerUser.full_name || sellerUser.username || 'Seller',
                    order.order_number,
                    productTitle,
                    formattedTotal,
                    buyerUser.full_name || buyerUser.username || 'Customer',
                    buyerUser.email
                  )
                }
              })()
            )
          }
        }

        // Wait for all emails — allSettled so one failure doesn't block others
        await Promise.allSettled(emailPromises)
      }
    } catch (emailErr) {
      console.error('Order email sending failed (non-critical):', emailErr)
    }

    return NextResponse.json({ success: true, orders })
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
