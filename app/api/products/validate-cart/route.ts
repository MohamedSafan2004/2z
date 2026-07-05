// app/api/products/validate-cart/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sensitiveRatelimit } from "@/lib/ratelimit"

type CartItem = { variantId: string; quantity: number }

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    const { success } = await sensitiveRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
    }

    const { items } = await req.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    const variantIds = items.map((item: CartItem) => item.variantId)

    const variants = await db.productVariant.findMany({
      where: { id: { in: variantIds }, product: { isActive: true } },
      include: { product: true },
    })

    for (const item of items) {
      const variant = variants.find((v: typeof variants[number]) => v.id === item.variantId)

      if (!variant) {
        return NextResponse.json(
          { error: `A product in your cart is no longer available.` },
          { status: 400 }
        )
      }

      if (variant.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Only ${variant.stockQuantity} left of ${variant.product.name} (${variant.color} / ${variant.size}).` },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Validate cart error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}