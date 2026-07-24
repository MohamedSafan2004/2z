import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { loginRatelimit } from "@/lib/ratelimit"
import { sendVerificationEmail } from "@/lib/email"
import crypto from "crypto"

function generateCode(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex")
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    const { success } = await loginRatelimit.limit(ip)

    if (!success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      )
    }

    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
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

    const verificationCode = generateCode()
    const verificationHash = hashCode(verificationCode)
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000)

    await db.user.update({
      where: { id: userId },
      data: {
        verificationCode: verificationHash,
        verificationCodeExpiry: verificationExpiry,
      },
    })

    await sendVerificationEmail({ to: user.email, code: verificationCode })

    return NextResponse.json({ message: "Code sent" })
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}