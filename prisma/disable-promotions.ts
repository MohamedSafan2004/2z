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
    where: { isActive: true },
    data: { isActive: false },
  })

  console.log(`✓ اتقفل ${result.count} عرض (Promotion) — isActive = false`)
  console.log("  العروض لسه موجودة في الداتابيز، بس مش هتتحسب في أي أوردر جديد.")
  console.log("  لو حبيت ترجعها تاني، شغل: npx tsx prisma/reactivate-promotions.ts")

  await pool.end()
}

main().catch(console.error)
