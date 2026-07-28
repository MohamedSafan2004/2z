import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { optionalAuth } from "@/lib/middleware"
import { sensitiveRatelimit } from "@/lib/ratelimit"
import { normalizeEgyptianPhone } from "@/lib/phone"

// الكود المرتبط بالـ flash offer popup — لازم يطابق اللي في app/api/leads/subscribe/route.ts
const EMAIL_LINKED_PROMO_CODE = "2ZSAVE10"

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    const { success } = await sensitiveRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
    }

    const auth = optionalAuth(req)

    const body: unknown = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const { code: rawCode, phone: rawPhone, email: rawEmail } = body as Record<string, unknown>

    const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : ""
    const phone = typeof rawPhone === "string" ? rawPhone.trim() : ""
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : ""

    if (!code)  return NextResponse.json({ error: "Enter a promo code" }, { status: 400 })
    if (!phone) return NextResponse.json({ error: "Enter your phone number first" }, { status: 400 })

    const normalizedPhone = normalizeEgyptianPhone(phone)
    if (!normalizedPhone) {
      return NextResponse.json({ error: "Enter a valid Egyptian phone number" }, { status: 422 })
    }

    // Fetch only the fields we need — avoids pulling createdAt and other unused columns
    const promo = await db.promoCode.findUnique({
      where: { code },
      select: { id: true, code: true, discount: true, isActive: true },
    })

    // 404 leaks whether the code exists — use 422 to give a uniform "invalid" signal
    if (!promo || !promo.isActive) {
      return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 422 })
    }

    // صلاحية 48 ساعة للكود المرتبط بالإيميل.
    // الكود 2ZSAVE10 مش صالح للعميل إلا لو بعت إيميله في البوب أب ولسه داخل حدود
    // الـ48 ساعة من وقت ما طلب الكود. لو نضيف كودات تانية مستقبلاً مش مرتبطة
    // بالمفهوم ده، الفحص هنا بيتفعّل بس لو الكود يساوي EMAIL_LINKED_PROMO_CODE بالظبط.
    if (code === EMAIL_LINKED_PROMO_CODE) {
      if (!email) {
        return NextResponse.json({ error: "Enter the email you used to get this code" }, { status: 400 })
      }
      const lead = await db.emailLead.findUnique({
        where: { email },
        select: { promoCode: true, codeExpiresAt: true },
      })
      if (!lead || lead.promoCode !== code) {
        return NextResponse.json({ error: "This code isn't linked to that email" }, { status: 422 })
      }
      if (lead.codeExpiresAt.getTime() < Date.now()) {
        return NextResponse.json({ error: "This code has expired" }, { status: 422 })
      }
    }

    // RACE CONDITION NOTE:
    // Between this check and the PromoCodeUsage insert in orders/route.ts,
    // a concurrent request could pass validation for the same phone/user
    // before either usage record is written. This is acceptable here because:
    // 1. The insert in the order transaction is the authoritative guard.
    // 2. This endpoint is validation-only — it doesn't commit anything.
    // If stricter enforcement is needed later, a DB-level unique constraint
    // on (promoCodeId, phone) would be the correct fix.

    // Run phone and userId checks in parallel — independent queries, no ordering dependency
    const [usedByPhone, usedByUser] = await Promise.all([
      db.promoCodeUsage.findFirst({
        where: { promoCodeId: promo.id, phone: normalizedPhone },
        select: { id: true },
      }),
      auth.userId
        ? db.promoCodeUsage.findFirst({
            where: { promoCodeId: promo.id, userId: auth.userId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ])

    if (usedByPhone) {
      return NextResponse.json(
        { error: "This code has already been used on this number" },
        { status: 409 }
      )
    }

    if (usedByUser) {
      return NextResponse.json(
        { error: "This code has already been used on this account" },
        { status: 409 }
      )
    }

    return NextResponse.json({ discount: promo.discount, code: promo.code })

  } catch (error) {
    console.error("Promo validate error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
