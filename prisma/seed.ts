import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient, Color, Size } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const colorCodes: Record<Color, string> = {
  BLACK: "B",
  WHITE: "W",
  GREY: "GR",
  BEIGE: "BE",
}

const stocks: Record<Color, Record<Size, number>> = {
  BLACK: { M: 18, L: 18, XL: 18 },
  WHITE: { M: 18, L: 18, XL: 18 },
  GREY:  { M: 18, L: 18, XL: 18 },
  BEIGE: { M: 20, L: 20, XL: 20 },
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.promoCodeUsage.deleteMany({})
  await prisma.promoCode.deleteMany({})
  await prisma.productVariant.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.category.deleteMany({})

  const tshirts = await prisma.category.create({
    data: { name: "T-Shirts", slug: "t-shirts" },
  })

  const colors: { name: string; color: Color }[] = [
    { name: "Essential Tee — Black", color: "BLACK" },
    { name: "Essential Tee — White", color: "WHITE" },
    { name: "Essential Tee — Grey",  color: "GREY"  },
    { name: "Essential Tee — Beige", color: "BEIGE" },
  ]

  for (const item of colors) {
    const product = await prisma.product.create({
      data: {
        name: item.name,
        description: "Premium quality tee. Minimal by design, built to last.",
        price: 700,
        categoryId: tshirts.id,
      },
    })

    for (const size of ["M", "L", "XL"] as Size[]) {
      const sku = `2Z-TEE-${colorCodes[item.color]}-${size}`
      const qty = stocks[item.color][size]

      await prisma.productVariant.create({
        data: {
          productId: product.id,
          color: item.color,
          size: size,
          stockQuantity: qty,
          openingStock: qty,
          sku,
        },
      })
    }
  }

  await prisma.promoCode.upsert({
    where: { code: "2ZSAVE10" },
    update: {},
    create: { code: "2ZSAVE10", discount: 10, isActive: true },
  })

  await prisma.invoiceCounter.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, lastNum: 0 },
  })

  console.log("✓ Seed complete")
  await pool.end()
}

main().catch(console.error)