// app/api/paymob/intention/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { optionalAuth } from "@/lib/middleware"
import { orderRatelimit } from "@/lib/ratelimit"
import { sanitize } from "@/lib/validation"

type CartItem = { variantId: string; quantity: number }

async function rollbackOrder(orderId: string, items: CartItem[]) {
  try {
    await db.$transaction(async (tx: typeof db) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED", paymentStatus: "FAILED" },
      })
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { increment: item.quantity } },
        })
      }
    })
  } catch (rollbackError) {
    console.error("Rollback failed:", rollbackError)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = optionalAuth(req)

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    const { success } = await orderRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { items, address, phone, email, paymentMethod } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 })
    }
    if (!email || !phone || !address) {
      return NextResponse.json({ error: "Email, phone, and address are required" }, { status: 400 })
    }
    if (!["card", "vodafone"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
    }

    for (const item of items) {
      if (!item.variantId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
        return NextResponse.json({ error: "Invalid item quantity" }, { status: 400 })
      }
    }

    const variantIds = items.map((item: CartItem) => item.variantId)

    const variants = await db.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    })

    type VariantWithProduct = typeof variants[number]

    for (const item of items) {
      const variant = variants.find((v: VariantWithProduct) => v.id === item.variantId)
      if (!variant) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const totalAmount = items.reduce((total: number, item: CartItem) => {
      const variant = variants.find((v: VariantWithProduct) => v.id === item.variantId)!
      return total + Number(variant.product.price) * item.quantity
    }, 0)

    const user = auth.userId
      ? await db.user.findUnique({ where: { id: auth.userId } })
      : null

    // 1. re-check stock + decrement + create order — كل ده في transaction واحدة
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
          status: "PENDING",
          paymentStatus: "PENDING",
          items: {
            create: items.map((item: CartItem) => {
              const variant = variants.find((v: VariantWithProduct) => v.id === item.variantId)!
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

    const integrationId =
      paymentMethod === "card"
        ? process.env.PAYMOB_INTEGRATION_ID_CARD
        : process.env.PAYMOB_INTEGRATION_ID_VODAFONE

    // 2. Paymob request مع حماية من network failure و timeout
    let intentionRes: Response
    try {
      intentionRes = await fetch("https://accept.paymob.com/v1/intention/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
        },
        body: JSON.stringify({
          amount: totalAmount * 100,
          currency: "EGP",
          payment_methods: [parseInt(integrationId as string, 10)],
          items: order.items.map((item: typeof order.items[number]) => ({
            name: item.productNameSnapshot,
            amount: Number(item.priceSnapshot) * 100,
            description: `${item.colorSnapshot} / ${item.sizeSnapshot}`,
            quantity: item.quantity,
          })),
          billing_data: {
            first_name: user?.name || sanitize(email.split("@")[0]),
            last_name: ".",
            email: sanitize(email),
            phone_number: phone,
            country: "EG",
            city: "Cairo",
            street: sanitize(address),
            building: ".",
            floor: ".",
            apartment: ".",
          },
          customer: {
            first_name: user?.name || sanitize(email.split("@")[0]),
            last_name: ".",
            email: sanitize(email),
          },
          extras: {
            order_id: order.id,
          },
        }),
      })
    } catch (fetchError) {
      console.error("Paymob fetch failed:", fetchError)
      await rollbackOrder(order.id, items)
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 })
    }

    // 3. safe JSON parsing — fallback لو الـ response مش JSON
    let intention: any
    try {
      intention = await intentionRes.json()
    } catch {
      const raw = await intentionRes.text().catch(() => "unreadable")
      console.error("Paymob response parse failed:", raw)
      await rollbackOrder(order.id, items)
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 })
    }

    if (!intentionRes.ok) {
      console.error("Paymob intention error:", intention)
      await rollbackOrder(order.id, items)
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 })
    }

    if (!intention.client_secret) {
      console.error("Paymob missing client_secret:", intention)
      await rollbackOrder(order.id, items)
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 })
    }

    return NextResponse.json({
      clientSecret: intention.client_secret,
      orderId: order.id,
    })
  } catch (error) {
    console.error("Intention error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}