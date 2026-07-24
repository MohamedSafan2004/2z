import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { comparePassword, generateToken } from "@/lib/auth"
import { loginRatelimit, emailLoginRatelimit } from "@/lib/ratelimit"
import { validateEmail } from "@/lib/validation"

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

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const raw = body as Record<string, unknown>

    const email    = typeof raw.email    === "string" ? raw.email.toLowerCase().trim() : null
    const password = typeof raw.password === "string" ? raw.password                   : null

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    // طبقة تانية على مستوى الـ email — بتوقف credential stuffing / brute-force
    // موزع على IPs مختلفة على نفس الحساب
    const emailCheck = await emailLoginRatelimit.limit(email)
    if (!emailCheck.success) {
      return NextResponse.json(
        { error: "Too many attempts on this account. Please try again later." },
        { status: 429 }
      )
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const isValid = await comparePassword(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before logging in" },
        { status: 403 }
      )
    }

    const token = generateToken(user.id, user.role, user.tokenVersion)

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
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    )
  }
}