import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const { 
      items, 
      buyer_id, 
      billing_info, 
      payment_method 
    } = await req.json()

    // 1. Fetch the commission rate (though it will be 0 since total is 0)
    const { data: settings } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'commission_rate')
      .single()

    const commissionRate = settings?.value ? parseFloat(settings.value) : 20;

    // 2. Create orders safely in the database
    const orderPromises = items.map(async (item: any) => {
      const selectedPackage = item.package
      if (!selectedPackage || !item.product) {
        throw new Error('Invalid item data')
      }

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      const subtotal = selectedPackage.price * item.quantity
      
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
          payment_method: payment_method || 'free',
          transaction_id: `free_${Date.now()}`,
          expected_delivery: expectedDelivery.toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      // Update seller wallet (remaining amount)
      const sellerEarnedAmount = total - serviceFee;
      
      if (sellerEarnedAmount > 0) {
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

    return NextResponse.json({ success: true, orders })
  } catch (error: any) {
    console.error('Error creating free order:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
