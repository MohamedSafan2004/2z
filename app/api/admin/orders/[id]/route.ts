import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/middleware"
import { google } from "googleapis"

const VALID_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]
const SALES_SHEET = "متابعة المبيعات"
const INVENTORY_SHEET = "المخزون"

function getGoogleAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })
}

async function appendToSalesSheet(sheets: any, spreadsheetId: string, order: any) {
  try {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SALES_SHEET}!A3:A`,
    })

    const rows = existing.data.values || []
    let lastDataRow = 0
    for (let i = 0; i < rows.length; i++) {
      const cellValue = rows[i]?.[0] || ""
      if (cellValue && cellValue !== "الإجماليات") {
        lastDataRow = i + 1
      }
    }

    let nextRow = lastDataRow + 3

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
        range: `${SALES_SHEET}!A${nextRow}:K${nextRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [row] },
      })

      nextRow++
    }
  } catch (error) {
    console.error("Sales sheet update error:", error)
  }
}

async function updateInventorySheet(sheets: any, spreadsheetId: string, order: any) {
  try {
    // هات كل الـ SKUs من تاب المخزون (عمود A) عشان نلاقي الـ row الصح لكل variant
    const skuColumn = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${INVENTORY_SHEET}!A3:A`,
    })

    const skuRows = skuColumn.data.values || []

    for (const item of order.items) {
      // هات الـ variant عشان نعرف الـ sku والـ stockQuantity الحالي
      const variant = await db.productVariant.findUnique({
        where: { id: item.variantId },
      })

      if (!variant || !variant.sku) continue

      // دور على الـ row اللي فيها نفس الـ SKU
      const rowIndex = skuRows.findIndex((r: string[]) => r[0] === variant.sku)
      if (rowIndex === -1) continue

      const sheetRow = rowIndex + 3 // +3 عشان البيانات بتبدأ من row 3

      // هات قيمة "مباع" الحالية من العمود G عشان نزود عليها
      const currentSoldCell = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${INVENTORY_SHEET}!G${sheetRow}`,
      })

      const currentSold = Number(currentSoldCell.data.values?.[0]?.[0] || 0)
      const newSold = currentSold + item.quantity

      // حدّث عمود "مباع" (G) و"متبقي" (H)
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${INVENTORY_SHEET}!G${sheetRow}:H${sheetRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[newSold, variant.stockQuantity]] },
      })
    }
  } catch (error) {
    console.error("Inventory sheet update error:", error)
  }
}

async function syncToSheets(order: any) {
  try {
    const auth = getGoogleAuth()
    const sheets = google.sheets({ version: "v4", auth })
    const spreadsheetId = process.env.GOOGLE_SHEET_ID as string

    await appendToSalesSheet(sheets, spreadsheetId, order)
    await updateInventorySheet(sheets, spreadsheetId, order)

    console.log("✅ Google Sheets synced for order:", order.id)
  } catch (error) {
    console.error("Google Sheets sync error:", error)
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
      await syncToSheets(order)
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Update order status error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}