// app/api/orders/verify-payment/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { optionalAuth } from "@/lib/middleware"
import { orderRatelimit } from "@/lib/ratelimit"
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email"

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

async function sendCustomerEmail(order: OrderWithItems): Promise<void> {
  // atomic guard — نمنع duplicate customer email
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
    // نرجع الـ flag عشان نسمح بـ retry
    await db.order.updateMany({
      where: { id: order.id },
      data: { confirmationEmailSent: false },
    }).catch(() => {})
  }
}

async function sendAdminEmail(order: OrderWithItems): Promise<void> {
  // atomic guard — نمنع duplicate admin email
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

async function handleSuccessfulPayment(
  order: OrderWithItems,
  txId: string
): Promise<"PAID" | "ALREADY_PAID"> {
  // replay protection
  if (order.paymobTransactionId === txId && order.paymentStatus === "PAID") {
    return "ALREADY_PAID"
  }

  // نسمح بـ CANCELLED/FAILED → PAID لو Paymob أكد بعد timeout
  // لكن مش بنخصم stock تاني لأنه اتخصم وقت الإنشاء
  const updated = await db.order.updateMany({
    where: {
      id: order.id,
      paymentStatus: { in: ["PENDING", "FAILED"] },
      // نمنع إعادة update لو خلاص PAID
    },
    data: {
      paymentStatus: "PAID",
      status: "PAID",
      paymobTransactionId: txId,
    },
  })

  if (updated.count === 0) return "ALREADY_PAID"

  await sendCustomerEmail(order)
  await sendAdminEmail(order)

  return "PAID"
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

    // safe JSON parsing
    let body: { orderId?: unknown; verifyToken?: unknown }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { orderId, verifyToken } = body

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
      // logged in — userId فقط، مش email
      if (order.userId !== auth.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    } else {
      // guest — verifyToken فقط
      if (
        !verifyToken ||
        typeof verifyToken !== "string" ||
        order.verifyToken !== verifyToken
      ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // لو خلاص PAID
    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ status: "PAID" })
    }

    // لو مفيش paymentId يبقى COD
    if (!order.paymentId) {
      return NextResponse.json({ status: order.paymentStatus })
    }

    // timeout check
    if (isOrderExpired(order) && order.paymentStatus === "PENDING") {
      await cancelExpiredOrder(order)
      // مش بنرجع FAILED فورًا — ممكن Paymob يأكد بعدين
      // هنفضل نسأل Paymob عشان نكون sure
    }

    // atomic cooldown lock — نمنع concurrent requests من ضرب Paymob
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
      // request تانية جت قبل انتهاء الـ cooldown
      return NextResponse.json({ status: order.paymentStatus })
    }

    const transactions = await fetchPaymobTransactions(order.paymentId)
    if (!transactions) {
      return NextResponse.json({ status: order.paymentStatus })
    }

    const successTx = findSuccessfulTransaction(transactions)

    if (successTx) {
      const result = await handleSuccessfulPayment(order, String(successTx.id))
      return NextResponse.json({ status: "PAID" })
    }

    // لو مفيش success — نرجع الـ status الحالي
    return NextResponse.json({ status: order.paymentStatus })

  } catch (error) {
    console.error("Verify payment error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}