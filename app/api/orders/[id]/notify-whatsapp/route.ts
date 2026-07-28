import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email"
import { sensitiveRatelimit } from "@/lib/ratelimit"
import { sendCapiEvent, getRequestMeta } from "@/lib/meta-capi"
import crypto from "crypto"

// بديل submit-instapay-ref: العميل معدش بيدخل رقم حوالة — دوسة زرار
// الواتساب هي دلوقتي أول وآخر إشارة نية دفع عندنا. الراوت ده بيغيّر
// status من PENDING_PAYMENT لـ PENDING، يبعت إيميلات العميل والأدمن،
// ويبعت Meta CAPI Purchase. التأكيد الفعلي (paymentStatus: PAID) لسه
// بيحصل يدوي من الأدمن داشبورد زي ما هو.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    const { success } = await sensitiveRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
    }

    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

    const { verifyToken, eventId } = body

    if (!verifyToken) {
      return NextResponse.json({ error: "Missing verification token" }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true, user: true },
    })

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (order.verifyToken !== verifyToken) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    if (order.paymentMethod !== "INSTAPAY") return NextResponse.json({ error: "Not an InstaPay order" }, { status: 400 })

    // idempotent: لو العميل دوس الزرار تاني (أو رجع للصفحة وضغط تاني)،
    // منبعتش إيميلات تكرار — نرجع الأوردر زي ما هو من غير أي تعديل
    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json(order)
    }

    const updated = await db.order.update({
      where: { id },
      data: { status: "PENDING" },
      include: { items: true },
    })

    const emailTo = order.guestEmail || order.user?.email
    const invoiceNum = `INV-${String(order.invoiceNumber).padStart(4, "0")}`

    if (emailTo) {
      try {
        await sendOrderConfirmation({
          to: emailTo,
          orderNumber: order.id,
          invoiceNumber: invoiceNum,
          items: order.items.map((item) => ({
            name: item.productNameSnapshot,
            color: item.colorSnapshot,
            size: item.sizeSnapshot,
            quantity: item.quantity,
            price: Number(item.priceSnapshot),
          })),
          total: Number(order.totalAmount),
          address: order.address || "",
          promoCode: order.promoCode ?? undefined,
          discountAmount: Number(order.discountAmount) > 0 ? Number(order.discountAmount) : undefined,
        })
      } catch (error) {
        console.error("Customer email failed:", error)
      }
    }

    try {
      await sendAdminNotification({
        orderNumber: order.id,
        invoiceNumber: invoiceNum,
        customerName: order.user?.name || order.guestName || "Guest",
        customerEmail: emailTo || "",
        customerPhone: order.phone || "",
        address: order.address || "",
        items: order.items.map((item) => ({
          name: item.productNameSnapshot,
          color: item.colorSnapshot,
          size: item.sizeSnapshot,
          quantity: item.quantity,
          price: Number(item.priceSnapshot),
        })),
        total: Number(order.totalAmount),
        promoCode: order.promoCode ?? undefined,
        discountAmount: Number(order.discountAmount) > 0 ? Number(order.discountAmount) : undefined,
      })
    } catch (error) {
      console.error("Admin notification failed:", error)
    }

    // ─── Meta CAPI: Purchase ──────────────────────────────────────────────
    // أول لحظة فيها نية دفع موثقة لطلب InstaPay (العميل دوس زرار الواتساب
    // بعد ما شاف رقم الحساب والمبلغ) — مش هننتظر تأكيد الأدمن اليدوي عشان
    // ده ممكن ياخد وقت طويل ويضعف الـ optimization بتاع Meta.
    try {
      const { clientIp, userAgent } = getRequestMeta(req)
      await sendCapiEvent({
        eventName: "Purchase",
        eventId: typeof eventId === "string" && eventId ? eventId : crypto.randomUUID(),
        eventSourceUrl: `https://www.2zstore.com/instapay-payment/${order.id}`,
        user: { email: emailTo || undefined, phone: order.phone || undefined, clientIp, userAgent },
        customData: {
          content_ids: updated.items.map((item) => item.variantId),
          content_type: "product",
          value: Number(order.totalAmount),
          num_items: updated.items.reduce((sum, item) => sum + item.quantity, 0),
          currency: "EGP",
          order_id: order.id,
        },
      })
    } catch (error) {
      console.error("Meta CAPI Purchase failed:", error)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Notify WhatsApp error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
