// app/api/products/validate-cart/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

type CartItem = { variantId: string; quantity: number }

export async function POST(req: NextRequest) {
  try {
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