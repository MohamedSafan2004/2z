export {}
/// <reference types="node" />
import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

// 50 كود، خصم 20% لكل واحد، وكل كود لمرة واحدة بس (maxUses = 1).
// لازم الـ migration "add_promo_max_uses" تتطبّق و prisma generate يتعمل قبل التشغيل.
// الاسكريبت آمن يتشغل أكتر من مرة: الكود الموجود مبيتعدّلش غير إنه لو maxUses بتاعه فاضي بنخليه 1.
// تشغيل تجريبي من غير ما يكتب في الداتابيز: أضف --dry في آخر الأمر.
const DISCOUNT_PERCENT = 20
const MAX_USES = 1

const RAW_CODES = [
  "ZOVARA27", "TWYRA82", "COTZIA49", "ZELVOR36", "NEXORA72",
  "DOVENZ58", "ZAYVON24", "VELZIA93", "COTERA67", "ZUNOVA45",
  "WEAVIX82", "ZORVENA39", "DUVORA76", "ZENTIQ28", "FABRIX94",
  "ZELORA53", "TWINZA86", "COVENZ42", "NOVYRA69", "ZAVERO31",
  "THREADZ78", "VEXORA25", "ZINTRA64", "COTVEX97", "DUPLIA43",
  "ZEVORA81", "WOVENIX56", "ZARVIA29", "FITYRA74", "ZONEXA38",
  "COTNOVA62", "VYRONZ85", "ZELVIA47", "TEXORA93", "ZOVIXA51",
  "DOVENZA26", "NEXIVA84", "ZURVEX37", "WELORA65", "ZENTRA92",
  "COTRIX48", "VANZIO73", "ZAYORA34", "TWELIX89", "FABZIA57",
  "ZORVEX21", "NIVORA68", "WOVARA95", "ZEXORA46", "VELNIX83",
]

async function main() {
  const dry = process.argv.includes("--dry")

  // تنظيف + إزالة التكرار جوه القايمة نفسها
  const codes = [...new Set(RAW_CODES.map((c) => c.trim().toUpperCase()).filter(Boolean))]
  if (codes.length !== RAW_CODES.length) {
    console.log(`⚠ في ${RAW_CODES.length - codes.length} كود مكرر جوه القايمة — اتشالوا`)
  }

  const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    const existing = await prisma.promoCode.findMany({
      where: { code: { in: codes } },
      select: { code: true, discount: true, isActive: true, maxUses: true, usedCount: true },
    })
    const existingMap = new Map(existing.map((e) => [e.code, e]))

    const toCreate = codes.filter((c) => !existingMap.has(c))
    const toLimit = existing.filter((e) => e.maxUses === null)

    for (const e of existing) {
      const notes: string[] = []
      if (e.discount !== DISCOUNT_PERCENT) notes.push(`⚠ الخصم الحالي ${e.discount}% مش ${DISCOUNT_PERCENT}%`)
      if (e.maxUses === null) notes.push("maxUses فاضي → هيتحط 1")
      console.log(`- ${e.code} موجود بالفعل (isActive: ${e.isActive}, usedCount: ${e.usedCount})${notes.length ? " — " + notes.join(" | ") : ""}`)
    }

    if (dry) {
      console.log(`\n[DRY RUN] هيتضاف ${toCreate.length} كود جديد، وهيتظبط maxUses لـ ${toLimit.length} كود موجود.`)
      return
    }

    if (toCreate.length > 0) {
      const result = await prisma.promoCode.createMany({
        data: toCreate.map((code) => ({ code, discount: DISCOUNT_PERCENT, maxUses: MAX_USES, isActive: true })),
        skipDuplicates: true,
      })
      console.log(`\n✓ اتضاف ${result.count} كود جديد (خصم ${DISCOUNT_PERCENT}%، لمرة واحدة، مفعّل)`)
    } else {
      console.log("\n✓ مفيش أكواد جديدة تتضاف")
    }

    if (toLimit.length > 0) {
      const fixed = await prisma.promoCode.updateMany({
        where: { code: { in: toLimit.map((e) => e.code) }, maxUses: null },
        data: { maxUses: MAX_USES },
      })
      console.log(`✓ اتظبط maxUses = ${MAX_USES} لـ ${fixed.count} كود كان موجود`)
    }
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
