import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/middleware"
import { sanitize } from "@/lib/validation"
import { apiRatelimit } from "@/lib/ratelimit"
import { Prisma } from "@/app/generated/prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    const { success } = await apiRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const { id } = await params
    const product = await db.product.findUnique({
      where: { id },
      include: { category: true, variants: true },
    })

   if (!product) {
  return NextResponse.json({ error: "Product not found" }, { status: 404 })
}

return NextResponse.json({
  ...product,
  price: Number(product.price),
  originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
})
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdmin(req)
    if ("error" in auth) return auth.error

    const { id } = await params
    const { name, description, price, categoryId, isActive } = await req.json()

    const updateData: Prisma.ProductUpdateInput = {}
    if (name !== undefined) updateData.name = sanitize(name)
    if (description !== undefined) updateData.description = sanitize(description)
    if (price !== undefined) {
      if (isNaN(Number(price)) || Number(price) <= 0) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 })
      }
      updateData.price = Number(price)
    }
    if (categoryId !== undefined) updateData.category = { connect: { id: categoryId } }
    if (isActive !== undefined) updateData.isActive = { set: Boolean(isActive) }
    const product = await db.product.update({
      where: { id },
      data: updateData,
      include: { category: true, variants: true },
    })

    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdmin(req)
    if ("error" in auth) return auth.error

    const { id } = await params

    await db.product.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Product deleted" })
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}