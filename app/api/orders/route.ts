import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, optionalAuth } from "@/lib/middleware"
import { orderRatelimit } from "@/lib/ratelimit"
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email"
import { sanitize } from "@/lib/validation"
import crypto from "crypto"

type CartItem = { variantId: string; quantity: number }

export async function POST(req: NextRequest) {
  try {
    const auth = optionalAuth(req)

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    const { success } = await orderRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: "Too many orders. Please try again later." }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

    const { items, address, phone, email, clientOrderId, promoCode, paymentMethod, instapayRef } = body

    if (!items || items.length === 0) return NextResponse.json({ error: "No items in order" }, { status: 400 })
    if (!email || !phone || !address) return NextResponse.json({ error: "Email, phone, and address are required" }, { status: 400 })

    const method = paymentMethod === "instapay" ? "INSTAPAY" : "COD"

    if (method === "INSTAPAY") {
      const ref = instapayRef?.trim()
      if (!ref || ref.length < 6) {
        return NextResponse.json({ error: "Please enter a valid InstaPay reference number" }, { status: 400 })
      }
    }

    for (const item of items) {
      if (!item.variantId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        return NextResponse.json({ error: "Invalid item quantity" }, { status: 400 })
      }
    }

    if (clientOrderId) {
      const existing = await db.order.findFirst({
        where: { clientOrderId },
        include: { items: true },
      })
      if (existing) return NextResponse.json({ ...existing, verifyToken: existing.verifyToken }, { status: 201 })
    }

    const variantIds = items.map((item: CartItem) => item.variantId)
    const variants = await db.productVariant.findMany({
      where: { id: { in: variantIds }, product: { isActive: true } },
      include: { product: true },
    })

    for (const item of items) {
      const variant = variants.find((v: typeof variants[number]) => v.id === item.variantId)
      if (!variant) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const subtotal = items.reduce((total: number, item: CartItem) => {
      const variant = variants.find((v: typeof variants[number]) => v.id === item.variantId)!
      return total + Number(variant.product.price) * item.quantity
    }, 0)

    let discountAmount = 0
    let validatedPromoCode: string | null = null
    let promoId: string | null = null

    if (promoCode && typeof promoCode === "string") {
      const code = promoCode.trim().toUpperCase()
      const promo = await db.promoCode.findUnique({ where: { code } })

      if (promo && promo.isActive) {
        const usedByPhone = await db.promoCodeUsage.findFirst({
          where: { promoCodeId: promo.id, phone },
        })
        const usedByUser = auth.userId
          ? await db.promoCodeUsage.findFirst({ where: { promoCodeId: promo.id, userId: auth.userId } })
          : null

        if (!usedByPhone && !usedByUser) {
          discountAmount = Math.round((subtotal * promo.discount) / 100)
          validatedPromoCode = promo.code
          promoId = promo.id
        }
      }
    }

    const totalAmount = subtotal - discountAmount
    const user = auth.userId ? await db.user.findUnique({ where: { id: auth.userId } }) : null
    const verifyToken = crypto.randomBytes(32).toString("hex")

    const order = await db.$transaction(async (tx) => {
      for (const item of items) {
        const freshVariant = await tx.productVariant.findUnique({ where: { id: item.variantId } })
        if (!freshVariant || freshVariant.stockQuantity < item.quantity) {
          throw new Error(`Not enough stock for variant ${item.variantId}`)
        }
      }

      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { decrement: item.quantity } },
        })
      }

      const counter = await tx.invoiceCounter.update({
        where: { id: 1 },
        data: { lastNum: { increment: 1 } },
      })

      const newOrder = await tx.order.create({
        data: {
          ...(auth.userId && { user: { connect: { id: auth.userId } } }),
          invoiceNumber: counter.lastNum,
          totalAmount,
          discountAmount,
          promoCode: validatedPromoCode,
          guestEmail: email || null,
          address: sanitize(address),
          phone: sanitize(phone),
          clientOrderId: clientOrderId || null,
          verifyToken,
          paymentMethod: method,
          instapayRef: method === "INSTAPAY" ? sanitize(instapayRef.trim()) : null,
          paymentStatus: "PENDING",
          items: {
            create: items.map((item: CartItem) => {
              const variant = variants.find((v: typeof variants[number]) => v.id === item.variantId)!
              return {
                variantId: item.variantId,
                quantity: item.quantity,
                productNameSnapshot: variant.product.name,
                priceSnapshot: variant.product.price,
                colorSnapshot: variant.color,
                sizeSnapshot: variant.size,
              }
            }),
          },
        },
        include: { items: true },
      })

      if (promoId && validatedPromoCode) {
        await tx.promoCodeUsage.create({
          data: {
            promoCodeId: promoId,
            userId: auth.userId || null,
            phone,
          },
        })
      }

      return newOrder
    })

    const emailTo = email || user?.email
    const invoiceNum = `INV-${String(order.invoiceNumber).padStart(4, "0")}`

    if (emailTo) {
      try {
        await sendOrderConfirmation({
          to: emailTo,
          orderNumber: order.id,
          invoiceNumber: invoiceNum,
          items: order.items.map((item: typeof order.items[number]) => ({
            name: item.productNameSnapshot,
            color: item.colorSnapshot,
            size: item.sizeSnapshot,
            quantity: item.quantity,
            price: Number(item.priceSnapshot),
          })),
          total: totalAmount,
          address: address || "",
          promoCode: validatedPromoCode ?? undefined,
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
        })
      } catch (error) {
        console.error("Customer email failed:", error)
      }
    }

    try {
      await sendAdminNotification({
        orderNumber: order.id,
        invoiceNumber: invoiceNum,
        customerName: user?.name || "Guest",
        customerEmail: emailTo || "",
        customerPhone: phone || "",
        address: address || "",
        items: order.items.map((item: typeof order.items[number]) => ({
          name: item.productNameSnapshot,
          color: item.colorSnapshot,
          size: item.sizeSnapshot,
          quantity: item.quantity,
          price: Number(item.priceSnapshot),
        })),
        total: totalAmount,
        promoCode: validatedPromoCode ?? undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
      })
    } catch (error) {
      console.error("Admin notification failed:", error)
    }

    return NextResponse.json({ ...order, verifyToken }, { status: 201 })
  } catch (error) {
    console.error("Order creation error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    if ("error" in auth) return auth.error

    const orders = await db.order.findMany({
      where: { userId: auth.userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}