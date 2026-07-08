export {}
/// <reference types="node" />
import * as dotenv from "dotenv"
dotenv.config()

// @ts-ignore
const { PrismaClient } = require("../app/generated/prisma/client")
// @ts-ignore
const { PrismaPg } = require("@prisma/adapter-pg")
// @ts-ignore
const { Pool } = require("pg")

// ─── عدّل هنا لو عايز تضيف منتج جديد أو تغير الاسم الجديد ─────────
const NEW_BASE_NAME = "Oversize T-Shirt"

const RENAME_MAP: Record<string, string> = {
  "Essential Tee — Black": `${NEW_BASE_NAME} — Black`,
  "Essential Tee — White": `${NEW_BASE_NAME} — White`,
  "Essential Tee — Grey":  `${NEW_BASE_NAME} — Grey`,
  "Essential Tee — Beige": `${NEW_BASE_NAME} — Beige`,
}
// ──────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  let updated = 0

  for (const [oldName, newName] of Object.entries(RENAME_MAP)) {
    const result = await prisma.product.updateMany({
      where: { name: oldName },
      data: { name: newName },
    })

    if (result.count > 0) {
      console.log(`✓ "${oldName}" → "${newName}" (${result.count} صف)`)
      updated += result.count
    } else {
      console.log(`⚠️  مش لاقي منتج بالاسم: "${oldName}"`)
    }
  }

  console.log(`\n✅ تم تحديث ${updated} منتج`)

  await pool.end()
}

main().catch(console.error)