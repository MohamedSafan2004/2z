import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { optionalAuth } from "@/lib/middleware"

export async function POST(req: NextRequest) {
  try {
    const auth = optionalAuth(req)
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

    const code: string = typeof body.code === "string" ? body.code.trim().toUpperCase() : ""
    const phone: string = typeof body.phone === "string" ? body.phone.trim() : ""

    if (!code) return NextResponse.json({ error: "Enter a promo code" }, { status: 400 })
    if (!phone) return NextResponse.json({ error: "Enter your phone number first" }, { status: 400 })

    // تحقق من الكود
    const promo = await db.promoCode.findUnique({ where: { code } })
    if (!promo || !promo.isActive) {
      return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 404 })
    }

    // تحقق من الاستخدام بالـ phone
    const usedByPhone = await db.promoCodeUsage.findFirst({
      where: { promoCodeId: promo.id, phone },
    })
    if (usedByPhone) {
      return NextResponse.json({ error: "This code has already been used on this number" }, { status: 409 })
    }

    // لو logged in — تحقق برضو بالـ userId
    if (auth.userId) {
      const usedByUser = await db.promoCodeUsage.findFirst({
        where: { promoCodeId: promo.id, userId: auth.userId },
      })
      if (usedByUser) {
        return NextResponse.json({ error: "This code has already been used on this account" }, { status: 409 })
      }
    }

    return NextResponse.json({ discount: promo.discount, code: promo.code })
  } catch (error) {
    console.error("Promo validate error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}