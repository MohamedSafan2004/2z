import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { loginRatelimit } from "@/lib/ratelimit"
import { validateEmail, validatePhone, validatePassword, sanitize } from "@/lib/validation"
import { sendVerificationEmail } from "@/lib/email"
import crypto from "crypto"

function generateCode(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex")
}

// استخراج اسم الـ field من Prisma P2002 error
function getDuplicateField(error: any): string | null {
  try {
    const target = error?.meta?.target
    if (Array.isArray(target)) {
      if (target.includes("email")) return "email"
      if (target.includes("phone")) return "phone"
    }
    // بعض الـ versions بتبعت string مش array
    if (typeof target === "string") {
      if (target.includes("email")) return "email"
      if (target.includes("phone")) return "phone"
    }
  } catch {}
  return null
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

    // safe JSON parsing — invalid body يرجع 400 مش 500
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

    // strict type validation — منع أي حاجة مش string
    const name     = typeof raw.name     === "string" ? raw.name.trim()               : null
    const email    = typeof raw.email    === "string" ? raw.email.toLowerCase().trim() : null
    const password = typeof raw.password === "string" ? raw.password                   : null
    const phone    = typeof raw.phone    === "string" ? raw.phone.trim()               : null

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

    const hashedPassword     = await hashPassword(password)
    const verificationCode   = generateCode()
    const verificationHash   = hashCode(verificationCode)
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000)

    let user: { id: string; email: string }

    try {
      user = await db.user.create({
        data: {
          name: sanitize(name),
          email,
          password: hashedPassword,
          // sanitize على الـ phone بس — email sanitize ممكن يكسر الـ format
          phone: phone ? sanitize(phone) : null,
          emailVerified: false,
          verificationCode: verificationHash,
          verificationCodeExpiry: verificationExpiry,
        },
      })
    } catch (dbError: any) {
      // P2002 — unique constraint violation
      if (dbError?.code === "P2002") {
        const field = getDuplicateField(dbError)
        if (field === "email") {
          return NextResponse.json(
            { error: "Email already exists" },
            { status: 400 }
          )
        }
        if (field === "phone") {
          return NextResponse.json(
            { error: "Phone number already exists" },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: "Account already exists" },
          { status: 400 }
        )
      }
      // أي error تاني — نـ rethrow عشان الـ outer catch يمسكه
      throw dbError
    }

    // لو الإيميل فشل — احذف الـ user عشان ميفضلش account معلق بدون كود
    try {
      await sendVerificationEmail({ to: email, code: verificationCode })
    } catch (emailError) {
      console.error("Verification email failed:", emailError)
      // cleanup — مش بنـ crash لو الحذف فشل
      await db.user.delete({ where: { id: user.id } }).catch((cleanupError) => {
        console.error("User cleanup failed after email error:", cleanupError)
      })
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