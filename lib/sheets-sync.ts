import { google, sheets_v4 } from "googleapis"
import { db } from "@/lib/db"

const SALES_SHEET = "متابعة المبيعات"
const INVENTORY_SHEET = "المخزون"

// Prisma بيرجع الأرقام العشرية كـ Decimal object مش string/number مباشر — النوع ده بيقبل الاتنين
type Numeric = number | string | { toString(): string }

type SyncOrderItem = {
  variantId: string
  quantity: number
  priceSnapshot: Numeric
  colorSnapshot: string
  sizeSnapshot: string
  productNameSnapshot: string
  isGift?: boolean
}

type SyncOrder = {
  id: string
  createdAt: string | Date
  invoiceNumber?: number | null
  discountAmount?: Numeric | null
  promoCode?: string | null
  shippingCost?: Numeric | null
  items: SyncOrderItem[]
}

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

async function getSheetId(sheets: sheets_v4.Sheets, spreadsheetId: string, sheetName: string): Promise<number> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === sheetName)
  return sheet?.properties?.sheetId ?? 0
}

// بيجمع القيم المتكررة لنفس المفتاح مع عدّها — مثلاً [White, White, Grey] بيرجع "White ×2, Grey ×1"
function summarizeWithCounts(values: string[]): string {
  const counts = new Map<string, number>()
  for (const v of values) {
    counts.set(v, (counts.get(v) || 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([val, count]) => (count > 1 ? `${val} ×${count}` : val))
    .join(", ")
}

// ─── Sales Sheet ──────────────────────────────────────────────────────────────
// الأوردر بياخد صف واحد بس في الشيت مهما كان عدد القطع أو الألوان/المقاسات مختلفة —
// مفيش صف لكل item زي الأول، عشان مييجيش عك في الشيت (نفس رقم الأوردر مكرر في عدة صفوف).
// عمود اللون والمقاس والـ SKU بيجمعوا كل القطع في نفس الخلية.

export async function appendToSalesSheet(order: SyncOrder) {
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

    const nextRow = lastDataRow + 3
    const sheetId = await getSheetId(sheets, spreadsheetId, SALES_SHEET)

    const paidItems = order.items.filter((it) => !it.isGift)
    const giftItems = order.items.filter((it) => it.isGift)

    // subtotal الحقيقي بتاع المنتجات المدفوعة بس (مش الهدايا، من غير شحن) — عشان نحسب نسبة الخصم صح
    const productsSubtotal = paidItems.reduce(
      (sum, it) => sum + Number(it.priceSnapshot) * it.quantity,
      0
    )

    // نسبة خصم الكود بس (مش خصم الـ bundle) — عشان عمود "نسبة الخصم" يفضل يعبر عن الكود لوحده
    const discount = order.discountAmount && order.promoCode && productsSubtotal > 0
      ? (Number(order.discountAmount) / productsSubtotal) * 100
      : 0

    const shippingCost = Number(order.shippingCost || 0)

    // إجمالي الكمية المدفوعة (مش شامل الهدايا في عمود الكمية الأساسي، بس بتتوضح في الاسم/اللون لو موجودة)
    const totalPaidQuantity = paidItems.reduce((sum, it) => sum + it.quantity, 0)

    // إجمالي السعر النهائي بعد خصم الكود (الهدايا سعرها صفر أصلاً فمالهاش تأثير على الحساب)
    const totalFinalPrice = paidItems.reduce((sum, it) => {
      const unitPrice = Number(it.priceSnapshot)
      return sum + unitPrice * it.quantity * (1 - discount / 100)
    }, 0)
    const revenue = totalFinalPrice

    const date = new Date(order.createdAt).toLocaleDateString("ar-EG", {
      day: "2-digit", month: "2-digit", year: "numeric",
    })

    const invoiceNum = order.invoiceNumber
      ? `INV-${String(order.invoiceNumber).padStart(4, "0")}`
      : order.id.slice(0, 8).toUpperCase()

    // اسم المنتج — لو كل القطع نفس المنتج (الحالة الشائعة) بيبقى اسم واحد،
    // ولو فيه أكتر من منتج مختلف (نادر) بيجمعهم بفاصلة من غير تكرار
    const productNames = Array.from(new Set(order.items.map((it) => it.productNameSnapshot)))
    const productNameCell = productNames.join(", ")

    // كل الـ SKUs مجمعة في خلية واحدة — الهدايا متعلّم عليها "(هدية)" عشان تتفرق
    const skuParts: string[] = []
    for (const item of order.items) {
      const variant = await db.productVariant.findUnique({ where: { id: item.variantId } })
      const sku = variant?.sku || item.variantId.slice(0, 8).toUpperCase()
      skuParts.push(item.isGift ? `${sku} (هدية)` : sku)
    }
    const skuCell = skuParts.join(", ")

    // كل الألوان وكل المقاسات مجمعة مع عدّها — مثلاً "White ×2, Grey ×1"
    const colorCell = summarizeWithCounts(order.items.map((it) => it.colorSnapshot))
    const sizeCell = summarizeWithCounts(order.items.map((it) => it.sizeSnapshot))

    const giftNote = giftItems.length > 0
      ? ` + ${giftItems.length} هدية`
      : ""

    const row = [
      date,
      skuCell,
      productNameCell + giftNote,
      colorCell,
      sizeCell,
      totalPaidQuantity,
      paidItems.length > 0 ? (productsSubtotal / totalPaidQuantity).toFixed(2) : 0, // متوسط سعر الوحدة
      discount.toFixed(1),
      totalFinalPrice.toFixed(2),
      revenue.toFixed(2),
      invoiceNum,
      shippingCost,
    ]

    // كتابة البيانات
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SALES_SHEET}!A${nextRow}:L${nextRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    })

    // center alignment على الصف
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: nextRow - 1,
                endRowIndex: nextRow,
                startColumnIndex: 0,
                endColumnIndex: 12,
              },
              cell: {
                userEnteredFormat: {
                  horizontalAlignment: "CENTER",
                },
              },
              fields: "userEnteredFormat.horizontalAlignment",
            },
          },
        ],
      },
    })
  } catch (error) {
    console.error("Sales sheet error:", error)
  }
}

// ─── Inventory Sheet (per order) ─────────────────────────────────────────────
// ده بيفضل يلف على كل item لوحده (مش الأوردر ككل) لأن كل SKU محتاج يتحدث في
// صفه الخاص بيه في تاب المخزون — ده مختلف تمامًا عن شكل تاب المبيعات.

export async function updateInventorySheet(order: SyncOrder) {
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

export async function syncToSheets(order: SyncOrder) {
  await appendToSalesSheet(order)
  await updateInventorySheet(order)
}
