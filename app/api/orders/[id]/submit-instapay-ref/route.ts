import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email"
import { sanitize } from "@/lib/validation"
import { sensitiveRatelimit } from "@/lib/ratelimit"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    const { success } = await sensitiveRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
    }

    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

    const { instapayRef, verifyToken } = body
    const ref = instapayRef?.trim()

    if (!ref || ref.length < 6) {
      return NextResponse.json({ error: "Please enter a valid InstaPay reference number" }, { status: 400 })
    }
    if (!verifyToken) {
      return NextResponse.json({ error: "Missing verification token" }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true, user: true },
    })

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (order.verifyToken !== verifyToken) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    if (order.paymentMethod !== "INSTAPAY") return NextResponse.json({ error: "Not an InstaPay order" }, { status: 400 })
    if (order.status !== "PENDING_PAYMENT") return NextResponse.json({ error: "Reference already submitted" }, { status: 400 })

    const updated = await db.order.update({
      where: { id },
      data: {
        instapayRef: sanitize(ref),
        status: "PENDING",
      },
      include: { items: true },
    })

    const emailTo = order.guestEmail || order.user?.email
    const invoiceNum = `INV-${String(order.invoiceNumber).padStart(4, "0")}`

    if (emailTo) {
      try {
        await sendOrderConfirmation({
          to: emailTo,
          orderNumber: order.id,
          invoiceNumber: invoiceNum,
          items: order.items.map((item) => ({
            name: item.productNameSnapshot,
            color: item.colorSnapshot,
            size: item.sizeSnapshot,
            quantity: item.quantity,
            price: Number(item.priceSnapshot),
          })),
          total: Number(order.totalAmount),
          address: order.address || "",
          promoCode: order.promoCode ?? undefined,
          discountAmount: Number(order.discountAmount) > 0 ? Number(order.discountAmount) : undefined,
        })
      } catch (error) {
        console.error("Customer email failed:", error)
      }
    }

    try {
      await sendAdminNotification({
        orderNumber: order.id,
        invoiceNumber: invoiceNum,
        customerName: order.user?.name || order.guestName || "Guest",
        customerEmail: emailTo || "",
        customerPhone: order.phone || "",
        address: order.address || "",
        items: order.items.map((item) => ({
          name: item.productNameSnapshot,
          color: item.colorSnapshot,
          size: item.sizeSnapshot,
          quantity: item.quantity,
          price: Number(item.priceSnapshot),
        })),
        total: Number(order.totalAmount),
        promoCode: order.promoCode ?? undefined,
        discountAmount: Number(order.discountAmount) > 0 ? Number(order.discountAmount) : undefined,
      })
    } catch (error) {
      console.error("Admin notification failed:", error)
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Submit InstaPay ref error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}