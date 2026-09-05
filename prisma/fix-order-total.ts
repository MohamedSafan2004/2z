export {}
/// <reference types="node" />
import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { Resend } from "resend"

// ─── عدّل هنا بس ─────────────────────────────
// دور بالتليفون أو الإيميل بتاع العميل عشان نتأكد 100% إننا بنصلح الأوردر الصح
// (الاتنين لازم يتطابقوا مع نفس الأوردر — ده تأكيد إضافي قبل التعديل)
const CUSTOMER_PHONE = "01286966204"
const CUSTOMER_EMAIL = "bebomahrous789@gmail.com"

// السكريبت هيوريك المبلغ الصح ويوقف — لازم تفتح SEND_EMAIL = true يدوي بعد ما
// تتأكد من الرقم، عشان محدش يبعت إيميل غلط بالغلط قبل ما يشوف النتيجة
const APPLY_FIX = true
const SEND_EMAIL = true
// ────────────────────────────────────────────────────────────────

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendCorrectionEmail(to: string, invoiceNumber: string, oldTotal: number, newTotal: number) {
  const content = `
    <h1 style="font-size:22px;font-weight:600;margin:0 0 8px">A Correction to Your Order</h1>
    <p style="font-size:14px;color:#444;margin:0 0 24px;line-height:1.6">
      Hi, we found a pricing error in your order <strong>${invoiceNumber}</strong> caused by a bug on our end
      with the "Buy 2 Get 1 Free" offer. We're sorry for the confusion — here's the correction:
    </p>
    <div style="background:#f7f7f7;border:1px solid #e5e5e5;border-radius:6px;padding:20px;margin-bottom:20px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#888">Previous amount shown</td>
          <td style="font-size:13px;color:#888;text-align:right;text-decoration:line-through">${oldTotal.toLocaleString()} EGP</td>
        </tr>
        <tr>
          <td style="padding-top:8px;font-size:15px;font-weight:700">Correct amount due</td>
          <td style="padding-top:8px;font-size:18px;font-weight:700;text-align:right">${newTotal.toLocaleString()} EGP</td>
        </tr>
      </table>
    </div>
    <p style="font-size:14px;color:#444;margin:0 0 8px;line-height:1.6">
      Your free gift from the Buy 2 Get 1 offer is unaffected and still included at no charge —
      only the total amount due on delivery has been corrected.
    </p>
    <p style="font-size:13px;color:#888;margin:24px 0 0">
      Questions? Just reply to this email.
    </p>
  `
  await resend.emails.send({
    from: "2Z Store <orders@2zstore.com>",
    to,
    subject: `A correction to your order ${invoiceNumber} — 2Z`,
    html: `<div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">${content}</div>`,
  })
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const order = await prisma.order.findFirst({
    where: {
      phone: CUSTOMER_PHONE,
      guestEmail: CUSTOMER_EMAIL,
      status: "PENDING",
      paymentMethod: "COD",
    },
    include: { items: true },
  })

  if (!order) {
    console.log("❌ مفيش أوردر PENDING/COD بالرقم والإيميل دول — راجع القيم فوق")
    await pool.end()
    return
  }

  const invoiceNum = `INV-${String(order.invoiceNumber).padStart(4, "0")}`
  console.log(`\n📦 لقيت الأوردر: ${order.id} (${invoiceNum})`)
  console.log(`   المبلغ الحالي (غلط): ${order.totalAmount} EGP`)

  const paidItems = order.items.filter((i) => !i.isGift)
  const subtotal = paidItems.reduce((sum, i) => sum + Number(i.priceSnapshot) * i.quantity, 0)
  const discountAmount = Number(order.discountAmount)
  const correctTotal = subtotal - discountAmount + Number(order.shippingCost)

  console.log(`   Subtotal (قطع مدفوعة بس): ${subtotal} EGP`)
  console.log(`   خصم (تير+برومو): ${discountAmount} EGP`)
  console.log(`   شحن: ${order.shippingCost} EGP`)
  console.log(`   المبلغ الصح: ${correctTotal} EGP`)

  if (Number(order.totalAmount) === correctTotal) {
    console.log("\n✓ المبلغ أصلاً صح — مفيش حاجة نعملها")
    await pool.end()
    return
  }

  if (!APPLY_FIX) {
    console.log("\n⏸  APPLY_FIX = false — دي معاينة بس، مفيش حاجة اتحفظت. راجع الرقم فوق، بعدين خلي APPLY_FIX = true وSEND_EMAIL = true وشغّل تاني.")
    await pool.end()
    return
  }

  const oldTotal = Number(order.totalAmount)

  await prisma.order.update({
    where: { id: order.id },
    data: { totalAmount: correctTotal },
  })

  console.log(`\n✅ اتصلح في الداتابيز: ${oldTotal} EGP → ${correctTotal} EGP`)

  if (SEND_EMAIL && order.guestEmail) {
    await sendCorrectionEmail(order.guestEmail, invoiceNum, oldTotal, correctTotal)
    console.log(`✅ إيميل التصحيح اتبعت لـ ${order.guestEmail}`)
  } else if (SEND_EMAIL) {
    console.log("⚠️  SEND_EMAIL = true بس مفيش guestEmail على الأوردر — مبعتناش إيميل")
  } else {
    console.log("ℹ️  SEND_EMAIL = false — مبعتناش إيميل. خليها true لو عايز تبعت.")
  }

  await pool.end()
}

main().catch(console.error)
