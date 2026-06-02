import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { loginRatelimit } from "@/lib/ratelimit"
import { validateEmail, validatePhone, validatePassword, sanitize } from "@/lib/validation"
import { sendVerificationEmail } from "@/lib/email"
import crypto from "crypto"

// cryptographically secure code generation
function generateCode(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

// SHA-256 hash — بنخزن الـ hash بس مش الكود الحقيقي
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

    // strict type validation
    const name     = typeof body.name     === "string" ? body.name     : null
    const email    = typeof body.email    === "string" ? body.email    : null
    const password = typeof body.password === "string" ? body.password : null
    const phone    = typeof body.phone    === "string" ? body.phone    : null

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      )
    }

    const cleanName  = sanitize(name)
    const cleanEmail = email.toLowerCase().trim()

    const hashedPassword     = await hashPassword(password)
    const verificationCode   = generateCode()
    const verificationHash   = hashCode(verificationCode)
    // expiry — 10 دقايق
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000)

    let user: { id: string }

    try {
      user = await db.user.create({
        data: {
          name: cleanName,
          email: cleanEmail,
          password: hashedPassword,
          phone: phone ? sanitize(phone) : null,
          emailVerified: false,
          verificationCode: verificationHash,
          verificationCodeExpiry: verificationExpiry,
        },
      })
    } catch (dbError: any) {
      // unique constraint — race condition لو اتنين سجلوا بنفس الإيميل في نفس الوقت
      if (dbError?.code === "P2002") {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        )
      }
      throw dbError
    }

    // لو الإيميل فشل — احذف الـ user عشان ميفضلش account معلق بدون كود
    try {
      await sendVerificationEmail({ to: cleanEmail, code: verificationCode })
    } catch (emailError) {
      console.error("Verification email failed:", emailError)
      await db.user.delete({ where: { id: user.id } }).catch(() => {})
      return NextResponse.json(
        { error: "Something went wrong, please try again" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Verification code sent to your email",
      userId: user.id,
    })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    )
  }
}