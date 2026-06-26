import { google } from "googleapis"
import { db } from "@/lib/db"

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

function getSheets() {
  const auth = getGoogleAuth()
  return google.sheets({ version: "v4", auth })
}

// ─── Sales Sheet ──────────────────────────────────────────────────────────────

export async function appendToSalesSheet(order: any) {
  try {
    const sheets = getSheets()
    const spreadsheetId = process.env.GOOGLE_SHEET_ID as string

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
    console.error("Sales sheet error:", error)
  }
}

// ─── Inventory Sheet (per order) ─────────────────────────────────────────────

export async function updateInventorySheet(order: any) {
  try {
    const sheets = getSheets()
    const spreadsheetId = process.env.GOOGLE_SHEET_ID as string

    const skuColumn = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${INVENTORY_SHEET}!A3:A`,
    })

    const skuRows: string[][] = skuColumn.data.values || []

    for (const item of order.items) {
      const variant = await db.productVariant.findUnique({
        where: { id: item.variantId },
      })

      if (!variant || !variant.sku) continue

      const rowIndex = skuRows.findIndex((r: string[]) => r[0] === variant.sku)
      if (rowIndex === -1) continue

      const sheetRow = rowIndex + 3
      const sold = variant.openingStock - variant.stockQuantity

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${INVENTORY_SHEET}!E${sheetRow}:H${sheetRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[
            variant.openingStock,
            "",
            Math.max(0, sold),
            variant.stockQuantity,
          ]],
        },
      })
    }
  } catch (error) {
    console.error("Inventory sheet error:", error)
  }
}

// ─── Full Inventory Sync (كل الـ variants دفعة واحدة) ────────────────────────

export async function syncAllInventory() {
  try {
    const sheets = getSheets()
    const spreadsheetId = process.env.GOOGLE_SHEET_ID as string

    const variants = await db.productVariant.findMany({
      where: { sku: { not: null } },
    })

    const skuColumn = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${INVENTORY_SHEET}!A3:A`,
    })

    const skuRows: string[][] = skuColumn.data.values || []

    for (const variant of variants) {
      if (!variant.sku) continue

      const rowIndex = skuRows.findIndex((r: string[]) => r[0] === variant.sku)
      if (rowIndex === -1) continue

      const sheetRow = rowIndex + 3
      const sold = variant.openingStock - variant.stockQuantity

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${INVENTORY_SHEET}!E${sheetRow}:H${sheetRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[
            variant.openingStock,
            "",
            Math.max(0, sold),
            variant.stockQuantity,
          ]],
        },
      })
    }

    console.log("✅ Full inventory sync complete")
  } catch (error) {
    console.error("Full inventory sync error:", error)
  }
}

// ─── Main sync trigger (بيتستخدم من الـ orders route) ────────────────────────

export async function syncToSheets(order: any) {
  await appendToSalesSheet(order)
  await updateInventorySheet(order)
}