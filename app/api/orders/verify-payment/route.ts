import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // لو مفيش paymentId يبقى COD — مش محتاج verify
    if (!order.paymentId) {
      return NextResponse.json({ status: order.paymentStatus })
    }

    // لو خلاص PAID مش محتاج نعمل call
    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ status: "PAID" })
    }

    // نسأل Paymob عن status الـ intention
    const paymobRes = await fetch(`https://accept.paymob.com/v1/intention/${order.paymentId}/`, {
      headers: {
        Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
      },
    })

    if (!paymobRes.ok) {
      return NextResponse.json({ status: order.paymentStatus })
    }

   const intention = await paymobRes.json()
    console.log("Paymob intention response:", JSON.stringify(intention))

    // Paymob بيرجع confirmed لما الدفع نجح
    if (intention.status === "confirmed" || intention.payment_status === "PAID") {
      await db.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID", status: "PAID" },
      })
      return NextResponse.json({ status: "PAID" })
    }

    return NextResponse.json({ status: order.paymentStatus })
  } catch (error) {
    console.error("Verify payment error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}