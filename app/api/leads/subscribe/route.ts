import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sensitiveRatelimit } from "@/lib/ratelimit"
import { validateEmail, sanitize } from "@/lib/validation"
import { sendCapiEvent, getRequestMeta } from "@/lib/meta-capi"

const LEAD_PROMO_CODE = "2ZSAVE10"

export async function POST(req: Request) {
  try {
    // Rate limiting بالـ IP — نفس الحد المستخدم للـ endpoints الحساسة التانية
    const { clientIp, userAgent } = getRequestMeta(req)
    const { success } = await sensitiveRatelimit.limit(clientIp || "unknown")
    if (!success) {
      return NextResponse.json({ error: "محاولات كتير، جرب تاني بعد شوية" }, { status: 429 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 })
    }

    const { email: rawEmail, eventId } = body as { email?: string; eventId?: string }
    if (typeof rawEmail !== "string") {
      return NextResponse.json({ error: "الإيميل مطلوب" }, { status: 400 })
    }

    const email = sanitize(rawEmail).toLowerCase()
    if (!validateEmail(email)) {
      return NextResponse.json({ error: "إيميل غير صالح" }, { status: 400 })
    }

    // لو الإيميل ده سجل قبل كده، رجّعله نفس الكود بدل ما نرفض الطلب
    const existing = await db.emailLead.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: true, promoCode: existing.promoCode, alreadyExisted: true })
    }

    await db.emailLead.create({
      data: { email, promoCode: LEAD_PROMO_CODE, source: "popup_10off" },
    })

    // Meta CAPI — Lead event (server-side، بيكمّل الـ Pixel client-side)
    if (typeof eventId === "string" && eventId) {
      await sendCapiEvent({
        eventName: "Lead",
        eventId,
        eventSourceUrl: req.headers.get("referer") || "https://www.2zstore.com",
        user: { email, clientIp, userAgent },
        customData: { content_name: "10% Off Popup" },
      })
    }

    return NextResponse.json({ success: true, promoCode: LEAD_PROMO_CODE, alreadyExisted: false })
  } catch (error) {
    console.error("[leads/subscribe] error:", error)
    return NextResponse.json({ error: "حصل خطأ، جرب تاني" }, { status: 500 })
  }
}
