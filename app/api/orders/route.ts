// app/api/orders/route.ts
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

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    const { success } = await orderRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: "Too many orders. Please try again later." },
        { status: 429 }
      )
    }

    const { items, address, phone, email, clientOrderId } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 })
    }
    if (!email || !phone || !address) {
      return NextResponse.json(
        { error: "Email, phone, and address are required" },
        { status: 400 }
      )
    }

    for (const item of items) {
      if (
        !item.variantId ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 10
      ) {
        return NextResponse.json({ error: "Invalid item quantity" }, { status: 400 })
      }
    }

    // idempotency — لو في clientOrderId نشوف لو الـ order ده اتعمل قبل كده
    if (clientOrderId) {
      const existing = await db.order.findFirst({
        where: { clientOrderId },
        include: { items: true },
      })
      if (existing) {
        return NextResponse.json(
          { ...existing, verifyToken: existing.verifyToken },
          { status: 201 }
        )
      }
    }

    const variantIds = items.map((item: CartItem) => item.variantId)
    const variants = await db.productVariant.findMany({
      where: {
        id: { in: variantIds },
        product: { isActive: true },
      },
      include: { product: true },
    })

    for (const item of items) {
      const variant = variants.find((v: typeof variants[number]) => v.id === item.variantId)
      if (!variant) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }
    }

    const totalAmount = items.reduce((total: number, item: CartItem) => {
      const variant = variants.find((v: typeof variants[number]) => v.id === item.variantId)!
      return total + Number(variant.product.price) * item.quantity
    }, 0)

    const user = auth.userId
      ? await db.user.findUnique({ where: { id: auth.userId } })
      : null

    const verifyToken = crypto.randomBytes(32).toString("hex")

    const order = await db.$transaction(async (tx: typeof db) => {
      for (const item of items) {
        const freshVariant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        })
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

      const newOrder = await tx.order.create({
        data: {
          userId: auth.userId || undefined,
          totalAmount,
          guestEmail: email || null,
          address: sanitize(address),
          phone: sanitize(phone),
          clientOrderId: clientOrderId || null,
          verifyToken,
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

      return newOrder
    })

    const emailTo = email || user?.email

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
          total: totalAmount,
          address: address || "",
        })
      } catch (error) {
        console.error("Customer email failed:", error)
      }
    }

    try {
      await sendAdminNotification({
        orderNumber: order.id,
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