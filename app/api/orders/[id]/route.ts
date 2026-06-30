import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/middleware"
import { syncToSheets } from "@/lib/sheets-sync"

const VALID_STATUSES = ["PENDING_PAYMENT", "PENDING", "CONFIRMED", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdmin(req)
    if ("error" in auth) return auth.error

    const { id } = await params
    const body = await req.json()
    const { status, action } = body

    // confirm instapay payment
    if (action === "confirm_instapay") {
      const current = await db.order.findUnique({ where: { id } })
      if (!current) return NextResponse.json({ error: "Order not found" }, { status: 404 })
      if (current.paymentMethod !== "INSTAPAY") return NextResponse.json({ error: "Not an InstaPay order" }, { status: 400 })
      if (current.paymentStatus === "PAID") return NextResponse.json({ error: "Already confirmed" }, { status: 400 })
      if (!current.instapayRef) return NextResponse.json({ error: "Customer hasn't submitted a reference number yet" }, { status: 400 })

      const updated = await db.order.update({
        where: { id },
        data: {
          paymentStatus: "PAID",
          status: "PAID",
          ...(!current.sheetSynced && { sheetSynced: true }),
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: true,
        },
      })

      // هنا paymentStatus فعلاً PAID + status فعلاً PAID — الـ sync صح 100%
      if (!current.sheetSynced) {
        await syncToSheets(updated)
      }

      return NextResponse.json(updated)
    }

    // update order status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const currentOrder = await db.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!currentOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const isCancelling = status === "CANCELLED" && currentOrder.status !== "CANCELLED"

    // COD: لما الأدمن يحول status لـ PAID أو DELIVERED، paymentStatus يتحول تلقائياً
    const isCodAutoConfirm =
      currentOrder.paymentMethod === "COD" &&
      (status === "PAID" || status === "DELIVERED") &&
      currentOrder.paymentStatus !== "PAID"

    // الـ paymentStatus النهائي بعد هذا التحديث (يهمنا نعرفه قبل الكتابة عشان نقرر الـ sync)
    const resultingPaymentStatus = isCodAutoConfirm ? "PAID" : currentOrder.paymentStatus

    // الباگ القديم كان بيعمل sync لو status=PAID بس مش بيتأكد من paymentStatus
    // الإصلاح: لازم paymentStatus يكون PAID فعلاً مش بس order status
    const isNewPaidOrDelivered =
      (status === "PAID" || status === "DELIVERED") &&
      resultingPaymentStatus === "PAID" &&
      !currentOrder.sheetSynced

    const order = await db.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          ...(isNewPaidOrDelivered && { sheetSynced: true }),
          ...(isCodAutoConfirm && { paymentStatus: "PAID" }),
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
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
    }, { timeout: 30000 })

    if (isNewPaidOrDelivered) {
      await syncToSheets(order)
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Update order status error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}