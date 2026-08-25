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
  const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL })
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

  const colors: { name: string; color: Color; description: string }[] = [
    {
      name: "Oversize T-Shirt — Black",
      color: "BLACK",
      description:
        "Our sharpest everyday staple. Black Oversize T-Shirt in a relaxed oversized boxy fit, cut from 100% premium interlock cotton with a double-sided construction that holds its shape wash after wash. Designed and made in Egypt.",
    },
    {
      name: "Oversize T-Shirt — White",
      color: "WHITE",
      description:
        "A clean-slate essential. White Oversize T-Shirt in a relaxed oversized boxy fit, cut from 100% premium interlock cotton with a double-sided construction for a heavier, structured drape. Designed and made in Egypt.",
    },
    {
      name: "Oversize T-Shirt — Grey",
      color: "GREY",
      description:
        "The easiest tee to build around. Grey Oversize T-Shirt in a relaxed oversized boxy fit, cut from 100% premium interlock cotton with a double-sided construction that keeps its structure. Designed and made in Egypt.",
    },
    {
      name: "Oversize T-Shirt — Beige",
      color: "BEIGE",
      description:
        "A softer, warmer neutral. Beige Oversize T-Shirt in a relaxed oversized boxy fit, cut from 100% premium interlock cotton with a double-sided construction and a heavier drape. Designed and made in Egypt.",
    },
  ]

  for (const item of colors) {
    const product = await prisma.product.create({
      data: {
        name: item.name,
        description: item.description,
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