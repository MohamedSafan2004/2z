import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword, generateToken } from "@/lib/auth"
import { loginRatelimit } from "@/lib/ratelimit"
import { validateEmail, validatePhone, validatePassword, sanitize } from "@/lib/validation"
import { sendVerificationEmail } from "@/lib/email"

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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

    const { name, email, password, phone } = await req.json()

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

    const cleanName = sanitize(name)
    const cleanEmail = email.toLowerCase().trim()

    const existingUser = await db.user.findUnique({ where: { email: cleanEmail } })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)
    const verificationCode = generateCode()

    const user = await db.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        phone: phone ? sanitize(phone) : null,
        emailVerified: false,
        verificationCode,
      },
    })

    // ابعت الكود على الإيميل
    await sendVerificationEmail({ to: cleanEmail, code: verificationCode })

    return NextResponse.json({
      message: "Verification code sent to your email",
      userId: user.id,
    })
  } catch (error) {
  console.error("REGISTER ERROR:", error)
  return NextResponse.json(
    { error: "Something went wrong, please try again" },
    { status: 500 }
  )
}
}