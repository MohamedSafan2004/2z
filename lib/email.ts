import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderConfirmation({
  to,
  orderNumber,
  items,
  total,
  address,
}: {
  to: string
  orderNumber: string
  items: { name: string; color: string; size: string; quantity: number; price: number }[]
  total: number
  address: string
}) {
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #1a1a1a;font-family:monospace;font-size:12px;color:#a0a0a0">
          ${item.name} — ${item.color} / ${item.size} × ${item.quantity}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #1a1a1a;font-family:monospace;font-size:12px;color:#f0ede6;text-align:right">
          ${item.price * item.quantity} EGP
        </td>
      </tr>
    `
    )
    .join("")

  await resend.emails.send({
    from: "2Z Store <orders@2zstore.com>",
    to,
    subject: `Order Confirmed — ${orderNumber.toUpperCase()}`,
    html: `
      <div style="background:#080808;padding:40px 24px;max-width:600px;margin:0 auto">
        <h1 style="font-family:Georgia,serif;font-size:32px;font-weight:300;color:#f0ede6;margin-bottom:8px">2Z</h1>
        <p style="font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#555;margin-bottom:40px">Minimal Streetwear</p>

        <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:300;color:#f0ede6;margin-bottom:8px">Order Confirmed</h2>
        <p style="font-family:monospace;font-size:11px;color:#666;margin-bottom:32px">
          Thank you for your order. We'll notify you when it ships.
        </p>

        <div style="background:#0f0f0f;padding:20px;margin-bottom:24px">
          <p style="font-family:monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555;margin-bottom:6px">Order Number</p>
          <p style="font-family:monospace;font-size:14px;color:#f0ede6">${orderNumber.slice(0, 8).toUpperCase()}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          ${itemsHtml}
          <tr>
            <td style="padding:16px 0;font-family:monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#555">Total</td>
            <td style="padding:16px 0;font-family:Georgia,serif;font-size:22px;color:#f0ede6;text-align:right">${total} EGP</td>
          </tr>
        </table>

        <div style="background:#0f0f0f;padding:20px;margin-bottom:32px">
          <p style="font-family:monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555;margin-bottom:6px">Delivery Address</p>
          <p style="font-family:monospace;font-size:11px;color:#a0a0a0">${address}</p>
        </div>

        <p style="font-family:monospace;font-size:10px;color:#444;line-height:1.8">
          Questions? Reply to this email or contact us on WhatsApp.<br/>
          Cairo, Egypt — 2Z Store
        </p>
      </div>
    `,
  })
}

export async function sendVerificationEmail({
  to,
  code,
}: {
  to: string
  code: string
}) {
  await resend.emails.send({
    from: "2Z Store <orders@2zstore.com>",
    to,
    subject: "Verify your email — 2Z",
    html: `
      <div style="background:#080808;padding:40px 24px;max-width:600px;margin:0 auto">
        <h1 style="font-family:Georgia,serif;font-size:32px;font-weight:300;color:#f0ede6;margin-bottom:8px">2Z</h1>
        <p style="font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#555;margin-bottom:40px">Minimal Streetwear</p>

        <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:300;color:#f0ede6;margin-bottom:16px">Verify Your Email</h2>
        <p style="font-family:monospace;font-size:11px;color:#666;margin-bottom:32px">
          Use this code to verify your email address.
        </p>

        <div style="background:#0f0f0f;padding:32px;text-align:center;margin-bottom:32px">
          <p style="font-family:Georgia,serif;font-size:48px;font-weight:300;color:#f0ede6;letter-spacing:0.3em">${code}</p>
        </div>

        <p style="font-family:monospace;font-size:10px;color:#444;line-height:1.8">
          This code expires in 10 minutes.<br/>
          If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  })
}
export async function sendAdminNotification({
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  address,
  items,
  total,
}: {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  items: { name: string; color: string; size: string; quantity: number; price: number }[]
  total: number
}) {
  const itemsHtml = items
    .map((item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #1a1a1a;font-family:monospace;font-size:12px;color:#a0a0a0">
          ${item.name} — ${item.color} / ${item.size} × ${item.quantity}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #1a1a1a;font-family:monospace;font-size:12px;color:#f0ede6;text-align:right">
          ${item.price * item.quantity} EGP
        </td>
      </tr>
    `).join("")

  await resend.emails.send({
    from: "2Z Store <orders@2zstore.com>",
    to: "2z.eg2004@gmail.com",
    subject: `🛍️ New Order — ${orderNumber.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="background:#080808;padding:40px 24px;max-width:600px;margin:0 auto">
        <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:300;color:#f0ede6;margin-bottom:8px">2Z — New Order</h1>
        <p style="font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#555;margin-bottom:32px">Action Required</p>

        <div style="background:#0f0f0f;padding:20px;margin-bottom:20px">
          <p style="font-family:monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555;margin-bottom:6px">Order</p>
          <p style="font-family:monospace;font-size:14px;color:#f0ede6">${orderNumber.slice(0, 8).toUpperCase()}</p>
        </div>

        <div style="background:#0f0f0f;padding:20px;margin-bottom:20px">
          <p style="font-family:monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#555;margin-bottom:10px">Customer</p>
          <p style="font-family:monospace;font-size:12px;color:#f0ede6;margin-bottom:4px">${customerName}</p>
          <p style="font-family:monospace;font-size:11px;color:#a0a0a0;margin-bottom:4px">${customerEmail}</p>
          <p style="font-family:monospace;font-size:11px;color:#a0a0a0;margin-bottom:4px">${customerPhone}</p>
          <p style="font-family:monospace;font-size:11px;color:#a0a0a0">${address}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          ${itemsHtml}
          <tr>
            <td style="padding:16px 0;font-family:monospace;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#555">Total</td>
            <td style="padding:16px 0;font-family:Georgia,serif;font-size:22px;color:#f0ede6;text-align:right">${total} EGP</td>
          </tr>
        </table>
      </div>
    `,
  })
}