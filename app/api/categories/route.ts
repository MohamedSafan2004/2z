import { NextRequest, NextResponse } from "next/server"
import { unstable_cache, revalidateTag } from "next/cache"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/middleware"
import { sanitize } from "@/lib/validation"

const getCachedCategories = unstable_cache(
  async () => {
    return db.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
    })
  },
  ["categories-list"],
  { revalidate: 3600, tags: ["categories"] }
)

export async function GET() {
  try {
    const categories = await getCachedCategories()
    return NextResponse.json(categories)
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

    const { name, slug } = await req.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      )
    }

    const category = await db.category.create({
      data: { name: sanitize(name), slug: sanitize(slug) },
    })

    revalidateTag("categories", "max")

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}