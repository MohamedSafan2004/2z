import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { loginRatelimit } from "@/lib/ratelimit"
import bcrypt from "bcryptjs"

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

    const { email, code, newPassword } = await req.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 }
      )
    }

    if (new Date() > user.resetCodeExpiry) {
      return NextResponse.json(
        { error: "Code has expired. Please request a new one." },
        { status: 400 }
      )
    }

    if (user.resetCode !== code) {
      return NextResponse.json(
        { error: "Invalid code" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpiry: null,
      },
    })

    return NextResponse.json({ message: "Password reset successfully" })
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}