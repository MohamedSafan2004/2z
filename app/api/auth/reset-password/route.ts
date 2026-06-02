  import { NextRequest, NextResponse } from "next/server"
  import { db } from "@/lib/db"
  import { loginRatelimit } from "@/lib/ratelimit"
  import bcrypt from "bcryptjs"
  import crypto from "crypto"

  const MAX_RESET_ATTEMPTS = 5

  function hashCode(code: string): string {
    return crypto.createHash("sha256").update(code).digest("hex")
  }

  function isStrongPassword(password: string): boolean {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    )
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
      const email = typeof body.email === "string"
        ? body.email.toLowerCase().trim()
        : null
      const code = typeof body.code === "string" ? body.code.trim() : null
      const newPassword = typeof body.newPassword === "string" ? body.newPassword : null

      if (!email || !code || !newPassword) {
        return NextResponse.json(
          { error: "All fields are required" },
          { status: 400 }
        )
      }

      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        )
      }

      if (!isStrongPassword(newPassword)) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters with uppercase, lowercase, and number" },
          { status: 400 }
        )
      }

      const user = await db.user.findUnique({ where: { email } })

      if (!user || !user.resetCode || !user.resetCodeExpiry) {
        return NextResponse.json(
          { error: "Invalid or expired code" },
          { status: 400 }
        )
      }

      // expiry check — نظف الـ DB ونرجع error واضح
      if (new Date() > user.resetCodeExpiry) {
        await db.user.update({
          where: { id: user.id },
          data: { resetCode: null, resetCodeExpiry: null, resetAttempts: 0 },
        }).catch(() => {})
        return NextResponse.json(
          { error: "Code has expired. Please request a new one." },
          { status: 400 }
        )
      }

      // brute force check — user-based
      if (user.resetAttempts >= MAX_RESET_ATTEMPTS) {
        await db.user.update({
          where: { id: user.id },
          data: { resetCode: null, resetCodeExpiry: null, resetAttempts: 0 },
        })
        return NextResponse.json(
          { error: "Too many failed attempts. Please request a new reset code." },
          { status: 400 }
        )
      }

      const incomingHash = hashCode(code)
      if (user.resetCode !== incomingHash) {
        // atomic increment لمنع race conditions
        const updated = await db.user.updateMany({
          where: { id: user.id, resetCode: { not: null } },
          data: { resetAttempts: { increment: 1 } },
        })

        // نجيب الـ attempts الحقيقي من الـ DB بعد الـ update
        const fresh = await db.user.findUnique({
          where: { id: user.id },
          select: { resetAttempts: true },
        })

        const currentAttempts = fresh?.resetAttempts ?? MAX_RESET_ATTEMPTS
        const remainingAttempts = MAX_RESET_ATTEMPTS - currentAttempts

        if (remainingAttempts <= 0) {
          await db.user.update({
            where: { id: user.id },
            data: { resetCode: null, resetCodeExpiry: null, resetAttempts: 0 },
          })
          return NextResponse.json(
            { error: "Too many failed attempts. Please request a new reset code." },
            { status: 400 }
          )
        }

        return NextResponse.json(
          { error: `Invalid code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? "s" : ""} remaining.` },
          { status: 400 }
        )
      }

      // password reuse protection
      const isSamePassword = await bcrypt.compare(newPassword, user.password)
      if (isSamePassword) {
        return NextResponse.json(
          { error: "New password must be different from your current password" },
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
          resetAttempts: 0,
        },
      })

      return NextResponse.json({ message: "Password reset successfully" })
    } catch (error) {
      console.error("Reset password error:", error)
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 }
      )
    }
  }