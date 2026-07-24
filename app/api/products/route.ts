// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/middleware"
import { sanitize } from "@/lib/validation"
import { apiRatelimit } from "@/lib/ratelimit"

const MAX_LIMIT = 50
const DEFAULT_LIMIT = 20

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    const { success } = await apiRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const { searchParams } = new URL(req.url)

    const categorySlug = searchParams.get("category")
    const cursor       = searchParams.get("cursor")
    const limitParam   = searchParams.get("limit")

    const limit = Math.min(
      Math.max(parseInt(limitParam ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    )

    // category slug validation — منع injection
    if (categorySlug && !/^[a-z0-9-]+$/.test(categorySlug)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 })
    }

    const products = await db.product.findMany({
      where: {
        isActive: true,
        ...(categorySlug && { category: { slug: categorySlug } }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          select: {
            id: true,
            color: true,
            size: true,
            stockQuantity: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    })

    const hasNextPage = products.length > limit
    const data = hasNextPage ? products.slice(0, limit) : products
    const nextCursor = hasNextPage ? data[data.length - 1].id : null

   return NextResponse.json({
  products: data.map((p) => ({
    ...p,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
  })),
  nextCursor,
  hasNextPage,
})
  } catch (error) {
    console.error("Get products error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if ("error" in auth) return auth.error

    const { name, description, price, categoryId } = await req.json()

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 }
      )
    }

    const parsedPrice = Number(price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 })
    }

    const category = await db.category.findUnique({ where: { id: categoryId } })
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const product = await db.product.create({
      data: {
        name: sanitize(name),
        description: description ? sanitize(description) : undefined,
        price: parsedPrice,
        categoryId,
      },
      include: {
        category: true,
        variants: true,
      },
    })

    return NextResponse.json(
      { ...product, price: Number(product.price) },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create product error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}