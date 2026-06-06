import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/middleware"

const VALID_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdmin(req)
    if ("error" in auth) return auth.error

    const { id } = await params
    const { status } = await req.json()

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    const currentOrder = await db.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // لو الأوردر بيتكنسل من الأدمن — نرجع الـ stock
    const isCancelling =
      status === "CANCELLED" && currentOrder.status !== "CANCELLED"

    const order = await db.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
          items: true,
        },
      })

      if (isCancelling) {
        for (const item of currentOrder.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: { increment: item.quantity } },
          })
        }
      }

      return updated
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error("Update order status error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}