import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email"

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

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ status: "PAID" })
    }

    if (!order.paymentId) {
      return NextResponse.json({ status: order.paymentStatus })
    }

    // نسأل Paymob عن الـ transactions
    const paymobRes = await fetch(
      `https://accept.paymob.com/v1/intention/${order.paymentId}/transactions/`,
      {
        headers: { Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}` },
      }
    )

    if (!paymobRes.ok) {
      return NextResponse.json({ status: order.paymentStatus })
    }

    const transactions = await paymobRes.json()
    const successTx = Array.isArray(transactions)
      ? transactions.find((tx) => tx.success === true)
      : null

    if (!successTx) {
      return NextResponse.json({ status: order.paymentStatus })
    }

    // update فقط لو مش PAID عشان نتجنب race condition
    await db.order.update({
      where: { id: orderId, paymentStatus: { not: "PAID" } },
      data: { paymentStatus: "PAID", status: "PAID" },
    })

    const emailTo = order.guestEmail || order.user?.email
    if (emailTo) {
      try {
        await sendOrderConfirmation({
          to: emailTo,
          orderNumber: order.id,
          items: order.items.map((item: typeof order.items[number]) => ({
            name: item.productNameSnapshot,
            color: item.colorSnapshot,
            size: item.sizeSnapshot,
            quantity: item.quantity,
            price: Number(item.priceSnapshot),
          })),
          total: Number(order.totalAmount),
          address: order.address || "",
        })
      } catch (error) {
        console.error("Customer email failed:", error)
      }
    }

    try {
      await sendAdminNotification({
        orderNumber: order.id,
        customerName: order.user?.name || "Guest",
        customerEmail: emailTo || "",
        customerPhone: order.phone || "",
        address: order.address || "",
        items: order.items.map((item: typeof order.items[number]) => ({
          name: item.productNameSnapshot,
          color: item.colorSnapshot,
          size: item.sizeSnapshot,
          quantity: item.quantity,
          price: Number(item.priceSnapshot),
        })),
        total: Number(order.totalAmount),
      })
    } catch (error) {
      console.error("Admin email failed:", error)
    }

    return NextResponse.json({ status: "PAID" })

  } catch (error) {
    console.error("Verify payment error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}