export {}
/// <reference types="node" />
import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

// ─── سكريبت لمرة واحدة — بيحدّث description لكل منتج بالاسم (مفيش مسح ولا reseed) ───
const DESCRIPTIONS: Record<string, string> = {
  "Oversize T-Shirt — Black":
    "Our sharpest everyday staple. Black Oversize T-Shirt in a relaxed oversized boxy fit, cut from 100% premium interlock cotton with a double-sided construction that holds its shape wash after wash. Designed and made in Egypt.",
  "Oversize T-Shirt — White":
    "A clean-slate essential. White Oversize T-Shirt in a relaxed oversized boxy fit, cut from 100% premium interlock cotton with a double-sided construction for a heavier, structured drape. Designed and made in Egypt.",
  "Oversize T-Shirt — Grey":
    "The easiest tee to build around. Grey Oversize T-Shirt in a relaxed oversized boxy fit, cut from 100% premium interlock cotton with a double-sided construction that keeps its structure. Designed and made in Egypt.",
  "Oversize T-Shirt — Beige":
    "A softer, warmer neutral. Beige Oversize T-Shirt in a relaxed oversized boxy fit, cut from 100% premium interlock cotton with a double-sided construction and a heavier drape. Designed and made in Egypt.",
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  let updated = 0

  for (const [name, description] of Object.entries(DESCRIPTIONS)) {
    const product = await prisma.product.findFirst({ where: { name } })

    if (!product) {
      console.log(`⚠️  مش لاقي منتج بالاسم: ${name}`)
      continue
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { description },
    })

    console.log(`✓ ${name} → description اتحدث`)
    updated++
  }

  console.log(`\n✓ تم تحديث ${updated} منتج`)

  await pool.end()
}

main().catch(console.error)
