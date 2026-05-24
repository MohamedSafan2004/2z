import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/middleware"

export async function GET(req: NextRequest) {
  try {
    const auth = requireAdmin(req)
    if ("error" in auth) return auth.error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const VALID_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }
    const orders = await db.order.findMany({
      where: {
        ...(status && { status: status as any }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: true,
      },
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