export {}
import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

// ─── الأرقام الجديدة حسب الجرد بتاريخ اليوم ───────────────────────────
// المفتاح = id بتاع الـ ProductVariant، القيمة = stockQuantity الجديد
const STOCK_UPDATES: Record<string, number> = {
  "cmqueiesc000280u31v17t3rf": 16, // BLACK - M
  "cmqueieux000380u3jxh94f2q": 14, // BLACK - L
  "cmqueiexi000480u3qu58ao54": 18, // BLACK - XL

  "cmqueif2p000680u377lm05xl": 7,  // WHITE - M  ← التصحيح المطلوب
  "cmqueif5a000780u3q39q9hs2": 9,  // WHITE - L
  "cmqueif80000880u36wa94j8f": 14, // WHITE - XL

  "cmqueifd7000a80u36vyep1qh": 17, // GREY - M
  "cmqueiffr000b80u306zsxejz": 17, // GREY - L
  "cmqueifib000c80u3g9gcoumi": 18, // GREY - XL

  "cmqueifnc000e80u3189rkk2m": 18, // BEIGE - M
  "cmqueifq6000f80u3ia14itol": 19, // BEIGE - L
  "cmqueifss000g80u3bc5lg0c9": 17, // BEIGE - XL
}
// ────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  let updated = 0

  for (const [id, newStock] of Object.entries(STOCK_UPDATES)) {
    try {
      const result = await prisma.productVariant.update({
        where: { id },
        data: { stockQuantity: newStock, openingStock: newStock },
        select: { sku: true, color: true, size: true, stockQuantity: true, openingStock: true },
      })
      console.log(`✓ ${result.sku} (${result.color} ${result.size}) → stock: ${result.stockQuantity} | opening: ${result.openingStock}`)
      updated++
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.log(`✗ فشل تحديث ${id}: ${message}`)
    }
  }

  console.log(`\n✅ تم تحديث ${updated} من ${Object.keys(STOCK_UPDATES).length} variant`)

  await pool.end()
}

main().catch(console.error)