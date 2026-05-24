import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateToken } from "@/lib/auth"
import { loginRatelimit } from "@/lib/ratelimit"

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1"
    const { success } = await loginRatelimit.limit(ip)

    if (!success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      )
    }
     const { userId, code } = await req.json()

    if (!userId || !code) {
      return NextResponse.json(
        { error: "User ID and code are required" },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email already verified" },
        { status: 400 }
      )
    }

    if (user.verificationCode !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      )
    }

    // تأكيد الإيميل وربط الأوردرات القديمة
    await db.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        verificationCode: null,
      },
    })

    // ربط الأوردرات القديمة بتاع الـ guestEmail بالأكونت
    await db.order.updateMany({
      where: { guestEmail: user.email },
      data: { userId: user.id },
    })

    const token = generateToken(user.id, user.role)

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}