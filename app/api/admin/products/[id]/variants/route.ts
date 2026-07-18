import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/middleware"

const VALID_COLORS = ["BLACK", "WHITE", "BEIGE", "GREY"]
const VALID_SIZES = ["M", "L", "XL"]

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdmin(req)
    if ("error" in auth) return auth.error

    const { id } = await params
    const { color, size, stockQuantity } = await req.json()

    if (!color || !size) {
      return NextResponse.json(
        { error: "Color and size are required" },
        { status: 400 }
      )
    }

    if (!VALID_COLORS.includes(color) || !VALID_SIZES.includes(size)) {
      return NextResponse.json(
        { error: "Invalid color or size" },
        { status: 400 }
      )
    }

    if (stockQuantity !== undefined && (isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0)) {
      return NextResponse.json(
        { error: "Invalid stock quantity" },
        { status: 400 }
      )
    }

    const variant = await db.productVariant.create({
      data: {
        productId: id,
        color,
        size,
        stockQuantity: stockQuantity ?? 0,
      },
    })

    return NextResponse.json(variant, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdmin(req)
    if ("error" in auth) return auth.error

    const { variantId, stockQuantity } = await req.json()

    if (!variantId) {
      return NextResponse.json(
        { error: "Variant ID is required" },
        { status: 400 }
      )
    }

    if (stockQuantity === undefined || isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0) {
      return NextResponse.json(
        { error: "Invalid stock quantity" },
        { status: 400 }
      )
    }

    const variant = await db.productVariant.update({
      where: { id: variantId },
      data: { stockQuantity: Number(stockQuantity) },
    })

    return NextResponse.json(variant)
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}