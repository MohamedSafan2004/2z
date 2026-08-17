import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const font = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`

function base(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <style>
    body { margin: 0; padding: 0; background-color: #ffffff; color: #111111; }
    @media (prefers-color-scheme: dark) {
      body { background-color: #0f0f0f !important; color: #f0ede6 !important; }
      .card { background-color: #1a1a1a !important; border-color: #2a2a2a !important; }
      .muted { color: #888888 !important; }
      .divider { border-color: #2a2a2a !important; }
    }
  </style>
</head>
<body style="font-family:${font};font-size:15px;line-height:1.6;background-color:#ffffff;color:#111111;padding:0;margin:0">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;padding:40px 24px">
    <tr><td>
      <div style="margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid #e5e5e5" class="divider">
        <span style="font-size:24px;font-weight:700;letter-spacing:-0.5px">2Z</span>
        <span class="muted" style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#888888;margin-left:10px">Minimal Streetwear</span>
      </div>
      ${content}
      <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e5e5e5" class="divider">
        <p class="muted" style="font-size:12px;color:#888888;margin:0">
          2Z Store · Cairo, Egypt<br/>
          Questions? Reply to this email.
        </p>
      </div>
    </td></tr>
  </table>
</body>
</html>
`
}

function card(content: string): string {
  return `
    <div class="card" style="background:#f7f7f7;border:1px solid #e5e5e5;border-radius:6px;padding:20px;margin-bottom:20px">
      ${content}
    </div>
  `
}

function label(text: string): string {
  return `<p class="muted" style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#888888;margin:0 0 6px">${text}</p>`
}

// ─── Order Confirmation ───────────────────────────────────────────────────────

export async function sendOrderConfirmation({
  to,
  orderNumber,
  invoiceNumber,
  items,
  total,
  address,
  promoCode,
  discountAmount,
}: {
  to: string
  orderNumber: string
  invoiceNumber?: string
  items: { name: string; color: string; size: string; quantity: number; price: number }[]
  total: number
  address: string
  promoCode?: string
  discountAmount?: number
}) {
  const originalTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const itemsRows = items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-size:14px" class="divider">
        ${item.name} — ${item.color} / ${item.size} × ${item.quantity}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-size:14px;text-align:right;white-space:nowrap" class="divider">
        ${(item.price * item.quantity).toLocaleString()} EGP
      </td>
    </tr>
  `).join("")

  const promoRow = promoCode && discountAmount ? `
    <tr>
      <td style="padding:10px 0;font-size:13px;color:#888888" class="muted">Promo: ${promoCode}</td>
      <td style="padding:10px 0;font-size:13px;color:#888888;text-align:right" class="muted">− ${discountAmount.toLocaleString()} EGP</td>
    </tr>
  ` : ""

  const originalRow = promoCode && discountAmount ? `
    <tr>
      <td style="padding:4px 0;font-size:12px;color:#888888" class="muted">Subtotal</td>
      <td style="padding:4px 0;font-size:12px;color:#888888;text-align:right" class="muted">${originalTotal.toLocaleString()} EGP</td>
    </tr>
  ` : ""

  const content = `
    <h1 style="font-size:22px;font-weight:600;margin:0 0 8px">Order Confirmed</h1>
    <p class="muted" style="font-size:14px;color:#888888;margin:0 0 28px">
      Thanks for your order. We'll let you know when it ships.
    </p>

    ${card(`
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            ${label("Order Number")}
            <p style="font-size:16px;font-weight:600;margin:0;letter-spacing:0.05em">#${orderNumber.slice(0, 8).toUpperCase()}</p>
          </td>
          ${invoiceNumber ? `
          <td style="text-align:right">
            ${label("Invoice")}
            <p style="font-size:16px;font-weight:600;margin:0;letter-spacing:0.05em">${invoiceNumber}</p>
          </td>
          ` : ""}
        </tr>
      </table>
    `)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
      ${itemsRows}
      ${originalRow}
      ${promoRow}
      <tr>
        <td style="padding:14px 0 0;font-size:14px;font-weight:600">Total</td>
        <td style="padding:14px 0 0;font-size:18px;font-weight:700;text-align:right">${total.toLocaleString()} EGP</td>
      </tr>
    </table>

    ${card(`
      ${label("Delivery Address")}
      <p style="font-size:14px;margin:0">${address}</p>
    `)}
  `

  await resend.emails.send({
    from: "2Z Store <orders@2zstore.com>",
    to,
    subject: `Order Confirmed — ${invoiceNumber || "#" + orderNumber.slice(0, 8).toUpperCase()}`,
    html: base(content),
  })
}

// ─── Verification Email ───────────────────────────────────────────────────────

export async function sendVerificationEmail({ to, code }: { to: string; code: string }) {
  const content = `
    <h1 style="font-size:22px;font-weight:600;margin:0 0 8px">Verify Your Email</h1>
    <p class="muted" style="font-size:14px;color:#888888;margin:0 0 28px">
      Enter this code to verify your email address.
    </p>
    ${card(`
      <p style="text-align:center;font-size:36px;font-weight:700;letter-spacing:0.3em;margin:12px 0">${code}</p>
    `)}
    <p class="muted" style="font-size:13px;color:#888888;margin:0">
      This code expires in 10 minutes.<br/>
      If you didn't request this, you can safely ignore this email.
    </p>
  `
  await resend.emails.send({
    from: "2Z Store <orders@2zstore.com>",
    to,
    subject: "Verify your email — 2Z",
    html: base(content),
  })
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail({ to, code }: { to: string; code: string }) {
  const content = `
    <h1 style="font-size:22px;font-weight:600;margin:0 0 8px">Reset Your Password</h1>
    <p class="muted" style="font-size:14px;color:#888888;margin:0 0 28px">
      Use this code to reset your password.
    </p>
    ${card(`
      <p style="text-align:center;font-size:36px;font-weight:700;letter-spacing:0.3em;margin:12px 0">${code}</p>
    `)}
    <p class="muted" style="font-size:13px;color:#888888;margin:0">
      This code expires in 10 minutes.<br/>
      If you didn't request a password reset, ignore this email.
    </p>
  `
  await resend.emails.send({
    from: "2Z Store <orders@2zstore.com>",
    to,
    subject: "Reset your password — 2Z",
    html: base(content),
  })
}

// ─── Abandoned Cart Reminder (InstaPay متروك بدون دفع) ───────────────────────

export async function sendAbandonedCartReminder({
  to,
  invoiceNumber,
  items,
  total,
  paymentUrl,
}: {
  to: string
  invoiceNumber: string
  items: { name: string; color: string; size: string; quantity: number }[]
  total: number
  paymentUrl: string
}) {
  const itemsRows = items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-size:14px" class="divider">
        ${item.name} — ${item.color} / ${item.size} × ${item.quantity}
      </td>
    </tr>
  `).join("")

  const content = `
    <h1 style="font-size:22px;font-weight:600;margin:0 0 8px">Your Order Is Waiting</h1>
    <p class="muted" style="font-size:14px;color:#888888;margin:0 0 28px">
      We saved your order ${invoiceNumber} — just complete the InstaPay transfer to confirm it.
    </p>

    ${card(`
      <table width="100%" cellpadding="0" cellspacing="0">
        ${itemsRows}
        <tr>
          <td style="padding:14px 0 0;font-size:14px;font-weight:600">Total</td>
        </tr>
        <tr>
          <td style="padding:2px 0 0;font-size:18px;font-weight:700">${total.toLocaleString()} EGP</td>
        </tr>
      </table>
    `)}

    <div style="text-align:center;margin:28px 0 8px">
      <a href="${paymentUrl}" style="display:inline-block;background:#111111;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:4px">
        Complete Payment
      </a>
    </div>

    <p class="muted" style="font-size:12px;color:#888888;margin:24px 0 0;text-align:center">
      Your items are reserved, but stock isn't guaranteed forever.
    </p>
  `

  await resend.emails.send({
    from: "2Z Store <orders@2zstore.com>",
    to,
    subject: `Complete your order ${invoiceNumber} — 2Z`,
    html: base(content),
  })
}

// ─── Admin Notification ───────────────────────────────────────────────────────

export async function sendAdminNotification({
  orderNumber,
  invoiceNumber,
  customerName,
  customerEmail,
  customerPhone,
  address,
  items,
  total,
  promoCode,
  discountAmount,
}: {
  orderNumber: string
  invoiceNumber?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  items: { name: string; color: string; size: string; quantity: number; price: number }[]
  total: number
  promoCode?: string
  discountAmount?: number
}) {
  const itemsRows = items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-size:14px" class="divider">
        ${item.name} — ${item.color} / ${item.size} × ${item.quantity}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #e5e5e5;font-size:14px;text-align:right;white-space:nowrap" class="divider">
        ${(item.price * item.quantity).toLocaleString()} EGP
      </td>
    </tr>
  `).join("")

  const promoRow = promoCode && discountAmount ? `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#888888" class="muted">Promo: ${promoCode}</td>
      <td style="padding:6px 0;font-size:13px;color:#888888;text-align:right" class="muted">− ${discountAmount.toLocaleString()} EGP</td>
    </tr>
  ` : ""

  const content = `
    <h1 style="font-size:22px;font-weight:600;margin:0 0 4px">New Order</h1>
    <p class="muted" style="font-size:13px;color:#888888;margin:0 0 28px">Action required — prepare for shipment.</p>

    ${card(`
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            ${label("Order Number")}
            <p style="font-size:16px;font-weight:600;margin:0">#${orderNumber.slice(0, 8).toUpperCase()}</p>
          </td>
          ${invoiceNumber ? `
          <td style="text-align:right">
            ${label("Invoice")}
            <p style="font-size:16px;font-weight:600;margin:0">${invoiceNumber}</p>
          </td>
          ` : ""}
        </tr>
      </table>
    `)}

    ${card(`
      ${label("Customer")}
      <p style="font-size:15px;font-weight:600;margin:0 0 4px">${customerName}</p>
      <p style="font-size:13px;color:#888888;margin:0 0 2px" class="muted">${customerEmail}</p>
      <p style="font-size:13px;color:#888888;margin:0 0 2px" class="muted">${customerPhone}</p>
      <p style="font-size:13px;color:#888888;margin:0" class="muted">${address}</p>
    `)}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
      ${itemsRows}
      ${promoRow}
      <tr>
        <td style="padding:14px 0 0;font-size:14px;font-weight:600">Total</td>
        <td style="padding:14px 0 0;font-size:18px;font-weight:700;text-align:right">${total.toLocaleString()} EGP</td>
      </tr>
    </table>
  `

  await resend.emails.send({
    from: "2Z Store <orders@2zstore.com>",
    to: "2z.eg2004@gmail.com",
    subject: `🛍️ New Order — ${invoiceNumber || "#" + orderNumber.slice(0, 8).toUpperCase()}`,
    html: base(content),
  })
}