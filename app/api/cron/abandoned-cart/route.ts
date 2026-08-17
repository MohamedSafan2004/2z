import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { sendAbandonedCartReminder } from "@/lib/email"

// نفس نمط sync-inventory بالظبط — CRON_SECRET بيتقارن بـ timingSafeEqual
function isValidCronSecret(authHeader: string | null): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected || !authHeader) return false

  const expectedHeader = `Bearer ${expected}`
  const a = Buffer.from(authHeader)
  const b = Buffer.from(expectedHeader)

  if (a.length !== b.length) return false

  return timingSafeEqual(a, b)
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.2zstore.com"
const REMINDER_DELAY_MS = 24 * 60 * 60 * 1000 // 24 ساعة

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!isValidCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - REMINDER_DELAY_MS)

  // أوردرات InstaPay اللي لسه PENDING_PAYMENT (مبعتش رقم حوالة أصلاً)،
  // عدى عليها 24 ساعة، ولسه مبعتلهاش ريمايندر
  const abandonedOrders = await db.order.findMany({
    where: {
      status: "PENDING_PAYMENT",
      paymentMethod: "INSTAPAY",
      createdAt: { lte: cutoff },
      abandonedCartEmailSentAt: null,
      guestEmail: { not: null },
    },
    include: { items: true },
    take: 50, // حد أقصى لكل تشغيلة، عشان منضربش Resend rate limit
  })

  let sent = 0
  let failed = 0

  for (const order of abandonedOrders) {
    const emailTo = order.guestEmail
    if (!emailTo) continue

    const invoiceNum = order.invoiceNumber
      ? `INV-${String(order.invoiceNumber).padStart(4, "0")}`
      : `#${order.id.slice(0, 8).toUpperCase()}`

    const paymentUrl = `${SITE_URL}/instapay-payment/${order.id}?token=${order.verifyToken}`

    try {
      await sendAbandonedCartReminder({
        to: emailTo,
        invoiceNumber: invoiceNum,
        items: order.items
          .filter((item) => !item.isGift)
          .map((item) => ({
            name: item.productNameSnapshot,
            color: item.colorSnapshot,
            size: item.sizeSnapshot,
            quantity: item.quantity,
          })),
        total: Number(order.totalAmount),
        paymentUrl,
      })

      // بنسجل وقت الإرسال فورًا بعد النجاح — لو الـ cron اشتغل تاني قبل
      // الـ 24 ساعة الجاية، مش هيبعت تاني لنفس الأوردر
      await db.order.update({
        where: { id: order.id },
        data: { abandonedCartEmailSentAt: new Date() },
      })

      sent++
    } catch (error) {
      console.error(`Abandoned cart email failed for order ${order.id}:`, error instanceof Error ? error.message : error)
      failed++
    }
  }

  return NextResponse.json({ success: true, sent, failed, checked: abandonedOrders.length })
}
