import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/middleware"
import { sanitize } from "@/lib/validation"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categorySlug = searchParams.get("category")

    const products = await db.product.findMany({
      where: {
        isActive: true,
        ...(categorySlug && {
          category: { slug: categorySlug },
        }),
      },
      include: {
        category: true,
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req)
    if ("error" in auth) return auth.error

    const { name, description, price, categoryId } = await req.json()

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 }
      )
    }
    if (isNaN(Number(price)) || Number(price) <= 0) {
      return NextResponse.json(
        { error: "Invalid price" },
        { status: 400 }
      )
}
    const product = await db.product.create({
      data: {
        name: sanitize(name),
        description: description ? sanitize(description) : undefined,
        price,
        categoryId,
      },
      include: {
        category: true,
        variants: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}