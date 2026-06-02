import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { loginRatelimit } from "@/lib/ratelimit"
import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

function generateCode(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

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
    const email = typeof body.email === "string"
      ? body.email.toLowerCase().trim()
      : null

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({
        message: "If this email exists, a code has been sent.",
      })
    }

    const resetCode = generateCode()
    const resetCodeHash = hashCode(resetCode)
    const resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000)

    await db.user.update({
      where: { id: user.id },
      data: {
        resetCode: resetCodeHash,
        resetCodeExpiry,
        resetAttempts: 0, // نصفر المحاولات لما يطلب كود جديد
      },
    })

    try {
      await resend.emails.send({
        from: "2Z Store <orders@2zstore.com>",
        to: user.email,
        subject: "Reset your password — 2Z",
        html: `
          <div style="background:#080808;padding:40px 24px;max-width:600px;margin:0 auto">
            <h1 style="font-family:Georgia,serif;font-size:32px;font-weight:300;color:#f0ede6;margin-bottom:8px">2Z</h1>
            <p style="font-family:monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#555;margin-bottom:40px">Minimal Streetwear</p>
            <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:300;color:#f0ede6;margin-bottom:16px">Reset Password</h2>
            <p style="font-family:monospace;font-size:11px;color:#666;margin-bottom:32px">Use this code to reset your password.</p>
            <div style="background:#0f0f0f;padding:32px;text-align:center;margin-bottom:32px">
              <p style="font-family:Georgia,serif;font-size:48px;font-weight:300;color:#f0ede6;letter-spacing:0.3em">${resetCode}</p>
            </div>
            <p style="font-family:monospace;font-size:10px;color:#444;line-height:1.8">
              This code expires in 10 minutes.<br/>
              If you didn't request this, ignore this email.
            </p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error("Reset email failed:", emailError)
      await db.user.update({
        where: { id: user.id },
        data: { resetCode: null, resetCodeExpiry: null, resetAttempts: 0 },
      }).catch(() => {})

      return NextResponse.json({
        message: "If this email exists, a code has been sent.",
      })
    }

    return NextResponse.json({
      message: "If this email exists, a code has been sent.",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}