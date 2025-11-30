import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { CourseDeliveryPayload, ProductDigitalAsset } from '@/lib/supabase'

const AUTO_DELIVERY_NOTE = 'Auto digital delivery'

interface AutoDeliverRequest {
  orderId?: string
  productId?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AutoDeliverRequest
    if (!body.orderId || !body.productId) {
      return NextResponse.json({ error: 'orderId and productId are required' }, { status: 400 })
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id,product_id,buyer_id,seller_id')
      .eq('id', body.orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.product_id && order.product_id !== body.productId) {
      return NextResponse.json({ error: 'Product does not match order' }, { status: 400 })
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id,title,creator_id,digital_files,course_delivery,auto_deliver,is_digital')
      .eq('id', body.productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const digitalFiles = Array.isArray(product.digital_files)
      ? (product.digital_files as ProductDigitalAsset[])
      : []
    const courseDelivery = (product.course_delivery || null) as CourseDeliveryPayload | null
    const hasCoursePayload = !!(
      courseDelivery &&
      ((Array.isArray(courseDelivery.links) && courseDelivery.links.length) ||
        (Array.isArray(courseDelivery.passkeys) && courseDelivery.passkeys.length) ||
        (courseDelivery.notes && courseDelivery.notes.trim()))
    )

    if (!product.auto_deliver && !hasCoursePayload && digitalFiles.length === 0) {
      return NextResponse.json({ delivered: false })
    }

    const results: string[] = []

    if (digitalFiles.length) {
      const { data: existingDeliverables } = await supabaseAdmin
        .from('order_deliverables')
        .select('id')
        .eq('order_id', order.id)
        .eq('description', AUTO_DELIVERY_NOTE)
        .limit(1)

      if (!existingDeliverables || existingDeliverables.length === 0) {
        const rows = digitalFiles.map((file) => ({
          order_id: order.id,
          file_name: file.name ?? 'Digital download',
          file_url: file.url,
          file_size: file.size ?? null,
          description: AUTO_DELIVERY_NOTE,
          uploaded_by: product.creator_id
        }))
        const { error: insertError } = await supabaseAdmin.from('order_deliverables').insert(rows)
        if (insertError) throw insertError
        results.push('digital-files')
      }
    }

    if (hasCoursePayload) {
      const { data: existingMessages } = await supabaseAdmin
        .from('order_messages')
        .select('id')
        .eq('order_id', order.id)
        .eq('is_system_message', true)
        .ilike('message', 'course access%')
        .limit(1)

      if (!existingMessages || existingMessages.length === 0) {
        const messageLines: string[] = []
        if (courseDelivery?.links?.length) {
          messageLines.push('Course links:\n' + courseDelivery.links.map((link) => `• ${link}`).join('\n'))
        }
        if (courseDelivery?.passkeys?.length) {
          messageLines.push('Access codes:\n' + courseDelivery.passkeys.map((code) => `• ${code}`).join('\n'))
        }
        if (courseDelivery?.notes) {
          messageLines.push(courseDelivery.notes)
        }

        if (messageLines.length) {
          const { error: messageError } = await supabaseAdmin.from('order_messages').insert({
            order_id: order.id,
            sender_id: product.creator_id,
            message: `Course access for ${product.title || 'your purchase'}\n\n${messageLines.join('\n\n')}`,
            is_system_message: true
          })
          if (messageError) throw messageError
          results.push('course-info')
        }
      }
    }

    return NextResponse.json({ delivered: results.length > 0, artifacts: results })
  } catch (error) {
    console.error('Auto deliver failed', error)
    return NextResponse.json({ error: 'Auto delivery failed' }, { status: 500 })
  }
}
