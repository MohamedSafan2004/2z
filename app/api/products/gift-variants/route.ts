import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// بيرجع كل الـ variants المتاحة (فيها ستوك) عشان الـ gift picker في الكارت
// يعرض بس الألوان والمقاسات اللي فعلاً موجودة
export async function GET() {
  try {
    const variants = await db.productVariant.findMany({
      where: {
        stockQuantity: { gt: 0 },
        product: { isActive: true },
      },
      select: {
        id: true,
        color: true,
        size: true,
        stockQuantity: true,
        product: { select: { name: true } },
      },
    })

    const available = variants.map((v) => ({
      variantId: v.id,
      color: v.color,
      size: v.size,
      productName: v.product.name,
    }))

    return NextResponse.json({ variants: available })
  } catch (error) {
    console.error("Gift variants fetch error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}