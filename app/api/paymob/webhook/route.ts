// app/api/paymob/webhook/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // التحقق من الـ HMAC عشان نتأكد إن الـ request جاي من Paymob فعلاً
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET!
    const receivedHmac = req.headers.get("x-hmac-signature") || body.hmac

    if (receivedHmac) {
      const dataToHash = [
        body.obj?.amount_cents,
        body.obj?.created_at,
        body.obj?.currency,
        body.obj?.error_occured,
        body.obj?.has_parent_transaction,
        body.obj?.id,
        body.obj?.integration_id,
        body.obj?.is_3d_secure,
        body.obj?.is_auth,
        body.obj?.is_capture,
        body.obj?.is_refunded,
        body.obj?.is_standalone_payment,
        body.obj?.is_voided,
        body.obj?.order?.id,
        body.obj?.owner,
        body.obj?.pending,
        body.obj?.source_data?.pan,
        body.obj?.source_data?.sub_type,
        body.obj?.source_data?.type,
        body.obj?.success,
      ].join("")

      const calculatedHmac = crypto
        .createHmac("sha512", hmacSecret)
        .update(dataToHash)
        .digest("hex")

      if (calculatedHmac !== receivedHmac) {
        console.error("Invalid HMAC")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const { success, obj } = body
    const orderId = obj?.order?.extras?.order_id || obj?.extras?.order_id

    if (!orderId) {
      return NextResponse.json({ error: "No order ID" }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (obj?.success === true) {
      // الدفع نجح
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "PAID",
        },
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
        } catch (e) {
          console.error("Email failed:", e)
        }
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
      } catch (e) {
        console.error("Admin notification failed:", e)
      }
    } else {
      // الدفع فشل — نرجع الـ stock
      await db.order.update({
        where: { id: orderId },
        data: { paymentStatus: "FAILED", status: "CANCELLED" },
      })

      for (const item of order.items) {
        await db.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}