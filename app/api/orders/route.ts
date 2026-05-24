import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, optionalAuth } from "@/lib/middleware"
import { orderRatelimit } from "@/lib/ratelimit"
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email"
import { sanitize } from "@/lib/validation"

export async function POST(req: NextRequest) {
  try {
    const auth = optionalAuth(req)

    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1"
    const { success } = await orderRatelimit.limit(ip)

    if (!success) {
      return NextResponse.json(
        { error: "Too many orders. Please try again later." },
        { status: 429 }
      )
    }

    const { items, address, phone, email } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items in order" },
        { status: 400 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // validate quantity لكل item
    for (const item of items) {
      if (!item.variantId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
        return NextResponse.json(
          { error: "Invalid item quantity" },
          { status: 400 }
        )
      }
    }

    const variantIds = items.map((item: any) => item.variantId)
    const variants = await db.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    })

    for (const item of items) {
      const variant = variants.find((v: typeof variants[0]) => v.id === item.variantId)

      if (!variant) {
        return NextResponse.json(
          { error: `Product not found` },
          { status: 404 }
        )
      }

      if (variant.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Not enough stock for ${variant.product.name}` },
          { status: 400 }
        )
      }
    }

    const totalAmount = items.reduce((total: number, item: any) => {
      const variant = variants.find((v: typeof variants[0]) => v.id === item.variantId)!
      return total + Number(variant.product.price) * item.quantity
    }, 0)

    const user = auth.userId ? await db.user.findUnique({
      where: { id: auth.userId },
    }) : null

    const order = await db.$transaction(async (tx: typeof db) => {
      const newOrder = await tx.order.create({
        data: {
          userId: auth.userId || undefined,
          totalAmount,
          guestEmail: email || null,
          address: address ? sanitize(address) : null,
          phone: phone ? sanitize(phone) : null,
          items: {
            create: items.map((item: any) => {
              const variant = variants.find((v: typeof variants[0]) => v.id === item.variantId)!
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

      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        })
      }

      return newOrder
    })

    const emailTo = email || user?.email

    // إيميل تأكيد للكاستومر
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
          total: totalAmount,
          address: address || "",
        })
      } catch (emailError) {
        console.error("Email failed:", emailError)
      }
    }

    // إشعار الـ Admin
    try {
      await sendAdminNotification({
        orderNumber: order.id,
        customerName: user?.name || "Guest",
        customerEmail: emailTo || "",
        customerPhone: phone || "",
        address: address || "",
        items: order.items.map((item: any) => ({
          name: item.productNameSnapshot,
          color: item.colorSnapshot,
          size: item.sizeSnapshot,
          quantity: item.quantity,
          price: Number(item.priceSnapshot),
        })),
        total: totalAmount,
      })
    } catch (adminEmailError) {
      console.error("Admin notification failed:", adminEmailError)
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    if ("error" in auth) return auth.error

    const user = await db.user.findUnique({
      where: { id: auth.userId },
    })

    const orders = await db.order.findMany({
      where: {
        OR: [
          { userId: auth.userId },
          { guestEmail: user?.email },
        ],
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}