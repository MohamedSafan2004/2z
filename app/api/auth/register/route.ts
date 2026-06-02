import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import crypto from "crypto"

function generateCode() {
  return crypto.randomInt(100000, 1000000).toString()
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex")
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const name = body.name?.trim()
    const email = body.email?.toLowerCase().trim()
    const password = body.password
    const phone = body.phone

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const code = generateCode()
    const codeHash = hashCode(code)
    const expiry = new Date(Date.now() + 10 * 60 * 1000)

    let user

    try {
      user = await db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          emailVerified: false,
          verificationCode: codeHash,
          verificationCodeExpiry: expiry,
        },
      })
    } catch (e: any) {
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        )
      }
      throw e
    }

    // هنا لاحقًا تبعت الإيميل
    // await sendVerificationEmail(email, code)

    return NextResponse.json({
      message: "User created",
      userId: user.id,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}