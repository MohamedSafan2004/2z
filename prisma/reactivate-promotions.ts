export {}
/// <reference types="node" />
import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const result = await prisma.promotion.updateMany({
    where: { isActive: false },
    data: { isActive: true },
  })

  console.log(`✓ اترجع تفعيل ${result.count} عرض (Promotion) — isActive = true`)
  console.log("  ملاحظة: الـ banner والـ gift picker في الواجهة لسه معطلين في الكود،")
  console.log("  محتاج ترجعهم من ProductDetailClient.tsx عشان العميل يشوفهم تاني.")

  await pool.end()
}

main().catch(console.error)
