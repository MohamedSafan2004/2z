// app/api/orders/verify-payment/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { optionalAuth } from "@/lib/middleware"
import { orderRatelimit } from "@/lib/ratelimit"
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email"
import crypto from "crypto"

const ORDER_PAYMENT_TIMEOUT_MS = 20 * 60 * 1000
const PAYMOB_POLL_COOLDOWN_MS  = 5 * 1000

type OrderItem = {
  id: string
  orderId: string
  variantId: string
  quantity: number
  productNameSnapshot: string
  priceSnapshot: number | string
  colorSnapshot: string
  sizeSnapshot: string
}

type OrderWithItems = {
  id: string
  userId: string | null
  paymentStatus: string
  status: string
  guestEmail: string | null
  address: string | null
  phone: string | null
  totalAmount: number | string
  paymentId: string | null
  paymobTransactionId: string | null
  verifyToken: string | null
  lastPaymentCheckAt: Date | null
  confirmationEmailSent: boolean
  adminEmailSent: boolean
  createdAt: Date
  items: OrderItem[]
  user: { name: string; email: string } | null
}

type PaymobTransaction = {
  id: number
  success: boolean
  pending: boolean
  error_occured: boolean
}

async function fetchPaymobTransactions(paymentId: string): Promise<PaymobTransaction[] | null> {
  try {
    const res = await fetch(
      `https://accept.paymob.com/v1/intention/${paymentId}/transactions/`,
      { headers: { Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

function findSuccessfulTransaction(transactions: PaymobTransaction[]): PaymobTransaction | null {
  return transactions.find(
    (tx) => tx.success === true && tx.pending === false && tx.error_occured === false
  ) ?? null
}

function isOrderExpired(order: OrderWithItems): boolean {
  return Date.now() - new Date(order.createdAt).getTime() > ORDER_PAYMENT_TIMEOUT_MS
}

function verifyPaymobHmac(params: URLSearchParams, hmacSecret: string): boolean {
  const received = params.get("hmac")
  if (!received) return false

  const dataToHash = [
    params.get("amount_cents"),
    params.get("created_at"),
    params.get("currency"),
    params.get("error_occured"),
    params.get("has_parent_transaction"),
    params.get("id"),
    params.get("integration_id"),
    params.get("is_3d_secure"),
    params.get("is_auth"),
    params.get("is_capture"),
    params.get("is_refunded"),
    params.get("is_standalone_payment"),
    params.get("is_voided"),
    params.get("order"),
    params.get("owner"),
    params.get("pending"),
    params.get("source_data.pan"),
    params.get("source_data.sub_type"),
    params.get("source_data.type"),
    params.get("success"),
  ]
    .map((v) => (v === null || v === undefined ? "" : String(v)))
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

async function sendCustomerEmail(order: OrderWithItems): Promise<void> {
  const guard = await db.order.updateMany({
    where: { id: order.id, confirmationEmailSent: false },
    data: { confirmationEmailSent: true },
  })
  if (guard.count === 0) return

  const emailTo = order.guestEmail || order.user?.email
  if (!emailTo) return

  try {
    await sendOrderConfirmation({
      to: emailTo,
      orderNumber: order.id,
      items: order.items.map((item: OrderItem) => ({
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

async function sendAdminEmail(order: OrderWithItems): Promise<void> {
  const guard = await db.order.updateMany({
    where: { id: order.id, adminEmailSent: false },
    data: { adminEmailSent: true },
  })
  if (guard.count === 0) return

  const emailTo = order.guestEmail || order.user?.email

  try {
    await sendAdminNotification({
      orderNumber: order.id,
      customerName: order.user?.name || "Guest",
      customerEmail: emailTo || "",
      customerPhone: order.phone || "",
      address: order.address || "",
      items: order.items.map((item: OrderItem) => ({
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

async function markOrderPaid(order: OrderWithItems, txId: string): Promise<boolean> {
  if (order.paymobTransactionId === txId && order.paymentStatus === "PAID") {
    return false
  }

  const updated = await db.order.updateMany({
    where: { id: order.id, paymentStatus: { in: ["PENDING", "FAILED"] } },
    data: { paymentStatus: "PAID", status: "PAID", paymobTransactionId: txId },
  })

  if (updated.count === 0) return false

  await sendCustomerEmail(order)
  await sendAdminEmail(order)
  return true
}

async function cancelExpiredOrder(order: OrderWithItems): Promise<void> {
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

export async function POST(req: NextRequest) {
  try {
    const auth = optionalAuth(req)

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    const { success: rateLimitOk } = await orderRatelimit.limit(ip)
    if (!rateLimitOk) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    let body: { orderId?: unknown; verifyToken?: unknown; paymobParams?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { orderId, verifyToken, paymobParams } = body

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: true },
    }) as OrderWithItems | null

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // ownership check
    if (auth.userId) {
      if (order.userId !== auth.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    } else {
      if (
        !verifyToken ||
        typeof verifyToken !== "string" ||
        order.verifyToken !== verifyToken
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ status: "PAID" })
    }

    // HMAC verification من الـ Paymob redirect params — الطريقة الأولى والأسرع
    if (paymobParams && typeof paymobParams === "string") {
      const hmacSecret = process.env.PAYMOB_HMAC_SECRET
      if (hmacSecret) {
        const params = new URLSearchParams(paymobParams)
        const isValid = verifyPaymobHmac(params, hmacSecret)
        const txId = params.get("id")
        const isSuccess =
          params.get("success") === "true" &&
          params.get("error_occured") === "false" &&
          params.get("pending") === "false"

        if (isValid && txId && isSuccess) {
          await markOrderPaid(order, txId)
          return NextResponse.json({ status: "PAID" })
        }
      }
    }

    // لو مفيش paymentId — COD أو مش اتدفع
    if (!order.paymentId) {
      return NextResponse.json({ status: order.paymentStatus })
    }

    // timeout check
    if (isOrderExpired(order) && order.paymentStatus === "PENDING") {
      await cancelExpiredOrder(order)
    }

    // atomic cooldown lock
    const cooldownThreshold = new Date(Date.now() - PAYMOB_POLL_COOLDOWN_MS)
    const lockAcquired = await db.order.updateMany({
      where: {
        id: order.id,
        OR: [
          { lastPaymentCheckAt: null },
          { lastPaymentCheckAt: { lt: cooldownThreshold } },
        ],
      },
      data: { lastPaymentCheckAt: new Date() },
    })

    if (lockAcquired.count === 0) {
      return NextResponse.json({ status: order.paymentStatus })
    }

    // fallback — نسأل Paymob مباشرة
    const transactions = await fetchPaymobTransactions(order.paymentId)
    if (!transactions) {
      return NextResponse.json({ status: order.paymentStatus })
    }

    const successTx = findSuccessfulTransaction(transactions)
    if (successTx) {
      await markOrderPaid(order, String(successTx.id))
      return NextResponse.json({ status: "PAID" })
    }

    return NextResponse.json({ status: order.paymentStatus })

  } catch (error) {
    console.error("Verify payment error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}