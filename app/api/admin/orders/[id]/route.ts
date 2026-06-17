import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/middleware"
import { google } from "googleapis"

const VALID_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]
const SHEET_NAME = "متابعة المبيعات"

async function appendToSheet(order: any) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    const sheets = google.sheets({ version: "v4", auth })
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    // نشوف آخر صف فيه بيانات في الجدول
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A3:A`,
    })

    let nextRow = (existing.data.values?.length || 0) + 3

    for (const item of order.items) {
      const unitPrice  = Number(item.priceSnapshot)
      const quantity   = item.quantity
      const discount   = order.discountAmount && order.promoCode
        ? Number(order.discountAmount) / (Number(order.totalAmount) + Number(order.discountAmount)) * 100
        : 0
      const finalPrice = unitPrice * quantity * (1 - discount / 100)
      const revenue    = finalPrice

      const date = new Date(order.createdAt).toLocaleDateString("ar-EG", {
        day: "2-digit", month: "2-digit", year: "numeric",
      })

      const row = [
        date,
        item.variantId.slice(0, 8).toUpperCase(),
        item.productNameSnapshot,
        item.colorSnapshot,
        item.sizeSnapshot,
        quantity,
        unitPrice,
        discount.toFixed(1),
        finalPrice.toFixed(2),
        revenue.toFixed(2),
        order.id.slice(0, 8).toUpperCase(),
      ]

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A${nextRow}:K${nextRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [row] },
      })

      nextRow++
    }

    console.log("✅ Google Sheets updated for order:", order.id)
  } catch (error) {
    console.error("Google Sheets append error:", error)
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
    const { status } = await req.json()

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

    const isCancelling =
      status === "CANCELLED" && currentOrder.status !== "CANCELLED"

    const isNewPaidOrDelivered =
      (status === "PAID" || status === "DELIVERED") &&
      currentOrder.status !== "PAID" &&
      currentOrder.status !== "DELIVERED"

    const order = await db.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status },
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
      await appendToSheet(order)
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Update order status error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}