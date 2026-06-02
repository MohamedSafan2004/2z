import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateToken } from "@/lib/auth"
import { loginRatelimit } from "@/lib/ratelimit"
import crypto from "crypto"

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex")
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    const { success } = await loginRatelimit.limit(ip)

    if (!success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      )
    }

    const body = await req.json()
    const userId = typeof body.userId === "string" ? body.userId : null
    const code   = typeof body.code   === "string" ? body.code.trim() : null

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

    if (!user.verificationCode) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      )
    }

    // expiry check
    if (user.verificationCodeExpiry && new Date() > user.verificationCodeExpiry) {
      await db.user.update({
        where: { id: userId },
        data: { verificationCode: null, verificationCodeExpiry: null },
      }).catch(() => {})
      return NextResponse.json(
        { error: "Code has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // SHA-256 hash comparison
    const incomingHash = hashCode(code)
    if (user.verificationCode !== incomingHash) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      )
    }

    await db.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
      },
    })

    // ربط الأوردرات القديمة بالأكونت
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
    console.error("Verify error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}