export {}
/// <reference types="node" />
import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const existing = await prisma.promoCode.findUnique({ where: { code: "2ZSAVE10" } })

  if (existing) {
    console.log(`✓ الكود 2ZSAVE10 موجود بالفعل — discount: ${existing.discount}% — isActive: ${existing.isActive}`)
    if (!existing.isActive) {
      console.log("  ⚠ ملاحظة: الكود isActive = false دلوقتي، مش هيشتغل في الـ checkout")
    }
  } else {
    await prisma.promoCode.create({
      data: { code: "2ZSAVE10", discount: 10, isActive: true },
    })
    console.log("✓ اتعمل الكود 2ZSAVE10 (10% خصم، مفعّل)")
  }

  await pool.end()
}

main().catch(console.error)
