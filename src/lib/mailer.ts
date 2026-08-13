import { MailerSend, EmailParams, Sender, Recipient, Attachment } from 'mailersend'

// ─── Singleton ───────────────────────────────────────────────────────
let _mailerSend: MailerSend | null = null

function getMailerSend(): MailerSend | null {
  if (!process.env.MAILERSEND_API_KEY) {
    console.warn('[mailer] MAILERSEND_API_KEY is not set – emails will be skipped')
    return null
  }
  if (!_mailerSend) {
    _mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY })
  }
  return _mailerSend
}

function getFromSender(label = 'FomKart'): Sender {
  return new Sender(
    process.env.MAILERSEND_FROM_EMAIL || 'no-reply@fomkart.com',
    label
  )
}

// Always use the production URL for email links (never localhost)
const BASE_URL = process.env.EMAIL_BASE_URL || 'https://fomkart.com'

// ─── Generic send helper ─────────────────────────────────────────────
export async function sendEmail({
  to,
  toName,
  subject,
  html,
  text,
  attachments,
  fromLabel,
}: {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
  attachments?: Attachment[]
  fromLabel?: string
}): Promise<boolean> {
  const ms = getMailerSend()
  if (!ms) return false

  try {
    const emailParams = new EmailParams()
      .setFrom(getFromSender(fromLabel))
      .setTo([new Recipient(to, toName || to)])
      .setSubject(subject)
      .setHtml(html)

    if (text) emailParams.setText(text)
    if (attachments?.length) emailParams.setAttachments(attachments)

    await ms.email.send(emailParams)
    console.log(`[mailer] Email sent → ${to} | ${subject}`)
    return true
  } catch (err) {
    console.error(`[mailer] Failed to send email to ${to}:`, err)
    return false
  }
}

// ─── 1. Welcome Email (after registration) ──────────────────────────
export async function sendWelcomeEmail(
  email: string,
  name: string,
  username: string
) {
  return sendEmail({
    to: email,
    toName: name,
    subject: 'Welcome to FomKart! 🎉',
    fromLabel: 'FomKart',
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:40px 32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Welcome to FomKart!</h1>
          <p style="color:#d1fae5;margin:8px 0 0;font-size:16px;">Your creator journey starts now</p>
        </div>
        <div style="padding:32px;">
          <p style="font-size:16px;color:#374151;line-height:1.6;">Hey <strong>${name}</strong>,</p>
          <p style="font-size:16px;color:#374151;line-height:1.6;">Thank you for joining FomKart! Your creator profile is live and ready to go.</p>
          <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:24px 0;border-left:4px solid #10b981;">
            <p style="margin:0;font-size:14px;color:#065f46;"><strong>Your store URL:</strong></p>
            <p style="margin:4px 0 0;font-size:16px;"><a href="${BASE_URL}/creator/${username}" style="color:#059669;text-decoration:none;font-weight:600;">fomkart.com/creator/${username}</a></p>
          </div>
          <p style="font-size:16px;color:#374151;line-height:1.6;">Here's what you can do next:</p>
          <ul style="font-size:15px;color:#4b5563;line-height:1.8;padding-left:20px;">
            <li>Add your first product or service</li>
            <li>Customize your store page</li>
            <li>Share your link on social media</li>
          </ul>
          <div style="text-align:center;margin-top:32px;">
            <a href="${BASE_URL}/creator/${username}" style="display:inline-block;background:#10b981;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Go to Your Store →</a>
          </div>
        </div>
        <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">© FomKart — Built for creators</p>
        </div>
      </div>
    `,
    text: `Welcome to FomKart, ${name}! Your store is live at fomkart.com/creator/${username}. Start by adding your first product.`,
  })
}

// ─── 2. Order Confirmation — Buyer ──────────────────────────────────
export async function sendOrderConfirmationBuyer(
  buyerEmail: string,
  buyerName: string,
  orderNumber: string,
  productTitle: string,
  total: number
) {
  return sendEmail({
    to: buyerEmail,
    toName: buyerName,
    subject: `Order Confirmed — ${orderNumber}`,
    fromLabel: 'FomKart Orders',
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:40px 32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Order Confirmed ✓</h1>
          <p style="color:#dbeafe;margin:8px 0 0;font-size:16px;">${orderNumber}</p>
        </div>
        <div style="padding:32px;">
          <p style="font-size:16px;color:#374151;line-height:1.6;">Hey <strong>${buyerName}</strong>,</p>
          <p style="font-size:16px;color:#374151;line-height:1.6;">Your order has been confirmed! Here are the details:</p>
          <div style="background:#f0f9ff;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #bfdbfe;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;font-size:14px;color:#6b7280;">Product</td>
                <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${productTitle}</td>
              </tr>
              <tr style="border-top:1px solid #e5e7eb;">
                <td style="padding:8px 0;font-size:14px;color:#6b7280;">Order #</td>
                <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${orderNumber}</td>
              </tr>
              <tr style="border-top:1px solid #e5e7eb;">
                <td style="padding:8px 0;font-size:16px;color:#111827;font-weight:700;">Total</td>
                <td style="padding:8px 0;font-size:16px;color:#111827;font-weight:700;text-align:right;">₹${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          <div style="text-align:center;margin-top:32px;">
            <a href="${BASE_URL}/orders" style="display:inline-block;background:#3b82f6;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">View Your Order →</a>
          </div>
        </div>
        <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">© FomKart — Built for creators</p>
        </div>
      </div>
    `,
    text: `Order Confirmed! Order ${orderNumber} for "${productTitle}" — Total: ₹${total.toFixed(2)}. View your order at fomkart.com/orders`,
  })
}

// ─── 3. New Order Notification — Seller ─────────────────────────────
export async function sendNewOrderSeller(
  sellerEmail: string,
  sellerName: string,
  orderNumber: string,
  productTitle: string,
  total: number,
  buyerName: string
) {
  return sendEmail({
    to: sellerEmail,
    toName: sellerName,
    subject: `💰 New Order Received — ${orderNumber}`,
    fromLabel: 'FomKart Orders',
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:40px 32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">New Order! 💰</h1>
          <p style="color:#fef3c7;margin:8px 0 0;font-size:16px;">You just made a sale</p>
        </div>
        <div style="padding:32px;">
          <p style="font-size:16px;color:#374151;line-height:1.6;">Hey <strong>${sellerName}</strong>,</p>
          <p style="font-size:16px;color:#374151;line-height:1.6;"><strong>${buyerName}</strong> just placed an order for your product!</p>
          <div style="background:#fffbeb;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #fde68a;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;font-size:14px;color:#6b7280;">Product</td>
                <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${productTitle}</td>
              </tr>
              <tr style="border-top:1px solid #e5e7eb;">
                <td style="padding:8px 0;font-size:14px;color:#6b7280;">Buyer</td>
                <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${buyerName}</td>
              </tr>
              <tr style="border-top:1px solid #e5e7eb;">
                <td style="padding:8px 0;font-size:16px;color:#111827;font-weight:700;">Amount</td>
                <td style="padding:8px 0;font-size:16px;color:#111827;font-weight:700;text-align:right;">₹${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          <div style="text-align:center;margin-top:32px;">
            <a href="${BASE_URL}/orders" style="display:inline-block;background:#f59e0b;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Manage Order →</a>
          </div>
        </div>
        <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">© FomKart — Built for creators</p>
        </div>
      </div>
    `,
    text: `New order! ${buyerName} ordered "${productTitle}" (${orderNumber}) — ₹${total.toFixed(2)}. Check your dashboard.`,
  })
}

// ─── 4. Digital Delivery Email (with attachments) ───────────────────
export async function sendOrderDeliveryEmail(
  buyerEmail: string,
  buyerName: string,
  productTitle: string,
  digitalFiles: { name?: string | null; url: string; size?: number | null }[]
) {
  // Download files and convert to base64 attachments
  const attachments: Attachment[] = []
  for (const file of digitalFiles) {
    if (!file.url) continue
    try {
      const response = await fetch(file.url)
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64Content = buffer.toString('base64')
        attachments.push(
          new Attachment(base64Content, file.name ?? 'download', 'attachment')
        )
      }
    } catch (dlErr) {
      console.warn(`[mailer] Failed to download file for attachment: ${file.url}`, dlErr)
    }
  }

  if (attachments.length === 0) {
    console.warn('[mailer] No attachments could be prepared — skipping delivery email')
    return false
  }

  return sendEmail({
    to: buyerEmail,
    toName: buyerName,
    subject: `Your digital files for: ${productTitle}`,
    fromLabel: 'FomKart Delivery',
    attachments,
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:40px 32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Your Files Are Here! 📦</h1>
          <p style="color:#ede9fe;margin:8px 0 0;font-size:16px;">${productTitle}</p>
        </div>
        <div style="padding:32px;">
          <p style="font-size:16px;color:#374151;line-height:1.6;">Hey <strong>${buyerName}</strong>,</p>
          <p style="font-size:16px;color:#374151;line-height:1.6;">Your digital files for <strong>${productTitle}</strong> are attached to this email. You can also access them from your orders dashboard.</p>
          <div style="background:#f5f3ff;border-radius:8px;padding:20px;margin:24px 0;border:1px solid #ddd6fe;">
            <p style="margin:0;font-size:14px;color:#5b21b6;font-weight:600;">📎 ${attachments.length} file${attachments.length > 1 ? 's' : ''} attached</p>
          </div>
          <div style="text-align:center;margin-top:32px;">
            <a href="${BASE_URL}/orders" style="display:inline-block;background:#8b5cf6;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">View Order →</a>
          </div>
        </div>
        <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">© FomKart — Built for creators</p>
        </div>
      </div>
    `,
    text: `Your digital files for "${productTitle}" are attached. You can also download them from your FomKart orders dashboard.`,
  })
}

// ─── 5. Newsletter Subscription Confirmation ────────────────────────
export async function sendNewsletterConfirmationEmail(
  email: string,
  name?: string
) {
  const displayName = name || 'there'
  return sendEmail({
    to: email,
    toName: name || email,
    subject: 'You\'re subscribed! 🎉',
    fromLabel: 'FomKart Newsletter',
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#ec4899,#db2777);padding:40px 32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">You're In! 🎉</h1>
          <p style="color:#fce7f3;margin:8px 0 0;font-size:16px;">Thanks for subscribing</p>
        </div>
        <div style="padding:32px;">
          <p style="font-size:16px;color:#374151;line-height:1.6;">Hey <strong>${displayName}</strong>,</p>
          <p style="font-size:16px;color:#374151;line-height:1.6;">You've been successfully subscribed to the newsletter. You'll receive updates, exclusive offers, and more right in your inbox.</p>
          <div style="text-align:center;margin-top:32px;">
            <a href="${BASE_URL}" style="display:inline-block;background:#ec4899;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">Explore FomKart →</a>
          </div>
        </div>
        <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">© FomKart — Built for creators</p>
        </div>
      </div>
    `,
    text: `Hey ${displayName}, you've been successfully subscribed to the newsletter! You'll receive updates, exclusive offers, and more.`,
  })
}

// ─── 6. Newsletter Broadcast ────────────────────────────────────────
export async function sendNewsletterBroadcast(
  recipientEmail: string,
  recipientName: string | undefined,
  subject: string,
  htmlContent: string
) {
  return sendEmail({
    to: recipientEmail,
    toName: recipientName || recipientEmail,
    subject,
    fromLabel: 'FomKart Newsletter',
    html: `
      <div style="font-family:'Inter',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="padding:32px;">
          ${htmlContent}
        </div>
        <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">© FomKart — Built for creators</p>
        </div>
      </div>
    `,
    text: htmlContent.replace(/<[^>]*>/g, ''),
  })
}
