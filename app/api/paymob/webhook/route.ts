// app/api/paymob/webhook/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email"

function verifyWebhook(body: any, hmacSecret: string): boolean {
  const received = body.hmac
  if (!received) return false

  const obj = body.obj || {}

  const dataToHash = [
    obj.amount_cents, obj.created_at, obj.currency, obj.error_occured,
    obj.has_parent_transaction, obj.id, obj.integration_id, obj.is_3d_secure,
    obj.is_auth, obj.is_capture, obj.is_refunded, obj.is_standalone_payment,
    obj.is_voided, obj.order?.id, obj.owner, obj.pending,
    obj.source_data?.pan, obj.source_data?.sub_type, obj.source_data?.type,
    obj.success,
  ]
    .map((v) => (v === undefined || v === null ? "" : String(v)))
    .join("")

  const calculated = crypto
    .createHmac("sha512", hmacSecret)
    .update(dataToHash)
    .digest("hex")

  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculated, "hex"),
      Buffer.from(received, "hex")
    )
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const hmacSecret = process.env.PAYMOB_HMAC_SECRET
    if (!hmacSecret) {
      console.error("PAYMOB_HMAC_SECRET not configured")
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
    }

    if (!verifyWebhook(body, hmacSecret)) {
      console.error("Webhook HMAC verification failed")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const obj = body.obj
    if (!obj) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const isSuccess =
      obj.success === true &&
      obj.error_occured === false &&
      obj.pending === false

    const isFailed =
      obj.success === false &&
      obj.pending === false

    if (!isSuccess && !isFailed) {
      return NextResponse.json({ ignored: true })
    }

    const orderId = obj.order?.extras?.order_id || obj.extras?.order_id
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

    const txId = String(obj.id)

    // replay protection
    if (order.paymobTransactionId === txId && order.paymentStatus === "PAID") {
      return NextResponse.json({ ignored: true })
    }

    if (isSuccess) {
      const updated = await db.order.updateMany({
        where: { id: order.id, paymentStatus: { in: ["PENDING", "FAILED"] } },
        data: { paymentStatus: "PAID", status: "PAID", paymobTransactionId: txId },
      })

      if (updated.count === 0) {
        return NextResponse.json({ received: true })
      }

      // email deduplication — نفس الـ atomic guard زي الـ verify-payment
      const customerGuard = await db.order.updateMany({
        where: { id: order.id, confirmationEmailSent: false },
        data: { confirmationEmailSent: true },
      })

      if (customerGuard.count > 0) {
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
            await db.order.updateMany({
              where: { id: order.id },
              data: { confirmationEmailSent: false },
            }).catch(() => {})
          }
        }
      }

      const adminGuard = await db.order.updateMany({
        where: { id: order.id, adminEmailSent: false },
        data: { adminEmailSent: true },
      })

      if (adminGuard.count > 0) {
        const emailTo = order.guestEmail || order.user?.email
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
          await db.order.updateMany({
            where: { id: order.id },
            data: { adminEmailSent: false },
          }).catch(() => {})
        }
      }
    }

    if (isFailed) {
      // stock restore داخل transaction واحدة
      await db.$transaction(async (tx: typeof db) => {
        const updated = await tx.order.updateMany({
          where: { id: order.id, paymentStatus: "PENDING" },
          data: { paymentStatus: "FAILED", status: "CANCELLED" },
        })

        if (updated.count === 0) return

        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          })
        }
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}