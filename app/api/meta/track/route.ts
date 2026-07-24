import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendCapiEvent, getRequestMeta } from "@/lib/meta-capi"
import { sensitiveRatelimit } from "@/lib/ratelimit"

// ─────────────────────────────────────────────────────────────────────────
// نقطة عامة يستخدمها الـ client عشان يبعت CAPI events محتاجة بيانات
// السيرفر (IP, user-agent) من غير ما نكشف الـ access token في المتصفح.
// حاليًا مستخدمة لـ Purchase (InstaPay) لحظة الضغط على "Send Payment Proof".
// ─────────────────────────────────────────────────────────────────────────

const ALLOWED_EVENTS = ["Purchase", "InitiateCheckout"] as const

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    const { success } = await sensitiveRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

    const { eventName, eventId, orderId, eventSourceUrl, verifyToken } = body

    if (!ALLOWED_EVENTS.includes(eventName)) {
      return NextResponse.json({ error: "Event not allowed" }, { status: 400 })
    }
    if (!eventId || !orderId) {
      return NextResponse.json({ error: "Missing eventId or orderId" }, { status: 400 })
    }
    if (!verifyToken || typeof verifyToken !== "string") {
      return NextResponse.json({ error: "Missing verification token" }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    })
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    // لازم نتأكد إن الطالب فعلاً صاحب الأوردر قبل ما نبعت event لـ Meta — وإلا أي
    // حد عارف orderId يقدر يلوّث Purchase events وهمية بأي قيمة
    if (order.verifyToken !== verifyToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const emailTo = order.guestEmail || order.user?.email
    const { clientIp, userAgent } = getRequestMeta(req)

    await sendCapiEvent({
      eventName,
      eventId,
      eventSourceUrl: eventSourceUrl || `https://www.2zstore.com/instapay-payment/${order.id}`,
      user: { email: emailTo || undefined, phone: order.phone || undefined, clientIp, userAgent },
      customData: {
        content_ids: order.items.map((item) => item.variantId),
        content_type: "product",
        value: Number(order.totalAmount),
        num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
        currency: "EGP",
        order_id: order.id,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Meta track event error:", error)
    // ما فيش داعي نرجّع error للعميل — تتبع Meta مش لازم يفشّل تجربة المستخدم
    return NextResponse.json({ ok: false })
  }
}