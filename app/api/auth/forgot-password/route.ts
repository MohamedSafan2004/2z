import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { loginRatelimit } from "@/lib/ratelimit"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

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

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    // مش بنقول للهاكر لو الإيميل موجود ولا لأ
    if (!user) {
      return NextResponse.json({ message: "If this email exists, a code has been sent." })
    }

    const resetCode = generateCode()
    const resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 دقايق

    await db.user.update({
      where: { id: user.id },
      data: { resetCode, resetCodeExpiry },
    })

    await resend.emails.send({
      from: "2Z Store <onboarding@resend.dev>",
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

   return NextResponse.json({ 
  message: "If this email exists, a code has been sent.",
})
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}