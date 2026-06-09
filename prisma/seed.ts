// @ts-ignore
const { PrismaClient } = require("../app/generated/prisma/client")
const { PrismaPg } = require("@prisma/adapter-pg")
const { Pool } = require("pg")
const dotenv = require("dotenv")

dotenv.config()

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  // امسح الداتا القديمة
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.promoCodeUsage.deleteMany({})
  await prisma.promoCode.deleteMany({})
  await prisma.productVariant.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.category.deleteMany({})

  // Category
  const tshirts = await prisma.category.create({
    data: { name: "T-Shirts", slug: "t-shirts" },
  })

  // Products
  const colors = [
    { name: "Essential Tee — Black", color: "BLACK" },
    { name: "Essential Tee — White", color: "WHITE" },
    { name: "Essential Tee — Navy", color: "NAVY" },
    { name: "Essential Tee — Grey", color: "GREY" },
  ]

  for (const item of colors) {
    const product = await prisma.product.create({
      data: {
        name: item.name,
        description: "Premium quality tee. Minimal by design, built to last.",
        price: 350,
        categoryId: tshirts.id,
      },
    })

    for (const size of ["S", "M", "L"]) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          color: item.color as any,
          size: size as any,
          stockQuantity: 20,
        },
      })
    }
  }

  // Promo Code
  await prisma.promoCode.upsert({
    where: { code: "SAVE10" },
    update: {},
    create: {
      code: "SAVE10",
      discount: 10,
      isActive: true,
    },
  })

  console.log("✓ Seed complete")
  await pool.end()
}

main().catch(console.error)