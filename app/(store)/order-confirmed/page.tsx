import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { orderId, forceUpdate } = await req.json()

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

    if (forceUpdate) {
      await db.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID", status: "PAID" },
      })

      const emailTo = order.guestEmail || order.user?.email
      if (emailTo) {
        try {
          await sendOrderConfirmation({
            to: emailTo,
            orderNumber: order.id,
            items: order.items.map((item: any) => ({
              name: item.productNameSnapshot,
              color: item.colorSnapshot,
              size: item.sizeSnapshot,
              quantity: item.quantity,
              price: Number(item.priceSnapshot),
            })),
            total: Number(order.totalAmount),
            address: order.address || "",
          })
        } catch {}
      }

      try {
        await sendAdminNotification({
          orderNumber: order.id,
          customerName: order.user?.name || "Guest",
          customerEmail: emailTo || "",
          customerPhone: order.phone || "",
          address: order.address || "",
          items: order.items.map((item: any) => ({
            name: item.productNameSnapshot,
            color: item.colorSnapshot,
            size: item.sizeSnapshot,
            quantity: item.quantity,
            price: Number(item.priceSnapshot),
          })),
          total: Number(order.totalAmount),
        })
      } catch {}

      return NextResponse.json({ status: "PAID" })
    }

    return NextResponse.json({ status: order.paymentStatus })
  } catch (error) {
    console.error("Verify payment error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}