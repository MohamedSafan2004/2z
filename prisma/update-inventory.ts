export {}
/// <reference types="node" />
import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { google } from "googleapis"

// ─── عدّل هنا بس ─────────────────────────────
const STOCK_ADD: Record<string, Record<string, number>> = {
  BLACK: { M: 0, L: 0, XL: 0 },
  WHITE: { M: 0, L: 0, XL: 0 },
  GREY:  { M: 0, L: 0, XL: 0 },
  BEIGE: { M: 0, L: 0, XL: 0 },
}

const NEW_PRICE: number | null = 550
// السعر الأصلي اتشال خالص — مفيش Sale/originalPrice دلوقتي (كل الـ UI اللي بيعتمد عليه
// بيختفي أوتوماتيك لو originalPrice = null، محتاجش تلمس أي كومبوننت تاني)
const NEW_ORIGINAL_PRICE: number | null = null
// عشان نقدر نمسح originalPrice الموجود فعلاً في الداتابيز (updateMany بيتجاهل undefined
// لكن مش null)، لازم نبعتها صراحةً لو عايزين null
const CLEAR_ORIGINAL_PRICE = true
// ────────────────────────────────────────────────────────────────

function skuCode(color: string): string {
  const map: Record<string, string> = {
    BLACK: "B", WHITE: "W", GREY: "GR", BEIGE: "BE",
  }
  return map[color] || color
}

async function syncInventoryToSheets(prisma: PrismaClient) {
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

    const variants = await prisma.productVariant.findMany({
      where: { sku: { not: null } },
    })

    const skuColumn = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `المخزون!A3:E`,
    })

    const sheetRows: string[][] = skuColumn.data.values || []

    for (const variant of variants) {
      if (!variant.sku) continue

      const rowIndex = sheetRows.findIndex((r: string[]) => r[0] === variant.sku)
      if (rowIndex === -1) {
        console.log(`⚠️  مش لاقي في الشيت: ${variant.sku}`)
        continue
      }

      const sheetRow = rowIndex + 3
      const sold = variant.openingStock - variant.stockQuantity

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `المخزون!E${sheetRow}:H${sheetRow}`,
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

      console.log(`✓ ${variant.sku} → افتتاحي: ${variant.openingStock} | مباع: ${Math.max(0, sold)} | متبقي: ${variant.stockQuantity}`)
    }

    console.log("✅ الشيت اتحدث بالكامل")
  } catch (error) {
    console.error("Sheets sync error:", error)
  }
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  let updated = 0

  for (const [color, sizes] of Object.entries(STOCK_ADD)) {
    for (const [size, quantity] of Object.entries(sizes as Record<string, number>)) {
      if (quantity === 0) continue

      const sku = `2Z-TEE-${skuCode(color)}-${size}`
      const variant = await prisma.productVariant.findUnique({ where: { sku } })

      if (!variant) {
        console.log(`⚠️  مش لاقي: ${sku}`)
        continue
      }

      await prisma.productVariant.update({
        where: { sku },
        data: {
          stockQuantity: { increment: quantity },
          openingStock:  { increment: quantity },
        },
      })

      console.log(`✓ ${sku} → زود ${quantity} قطعة`)
      updated++
    }
  }

  if (NEW_PRICE !== null) {
    await prisma.product.updateMany({
      data: {
        price: NEW_PRICE,
        ...(CLEAR_ORIGINAL_PRICE
          ? { originalPrice: null }
          : NEW_ORIGINAL_PRICE !== null
          ? { originalPrice: NEW_ORIGINAL_PRICE }
          : {}),
      },
    })
    console.log(`✓ السعر اتحدد → ${NEW_PRICE} EGP (السعر الأصلي: ${CLEAR_ORIGINAL_PRICE ? "null (مفيش Sale)" : NEW_ORIGINAL_PRICE + " EGP"})`)
  }

  console.log(`\n✓ تم تحديث ${updated} variant`)

  await syncInventoryToSheets(prisma)

  await pool.end()
}

main().catch(console.error)