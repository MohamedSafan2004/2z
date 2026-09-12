import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = (process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL) as string
const adapter = new PrismaPg({ connectionString })
const db = new PrismaClient({ adapter })

async function main() {
  // buy 2 get 3 free — القديمة (promo-buy2get1) بتتقفل هنا بدل ما تتمسح، عشان
  // أي أوردر قديم لسه مرتبط بيها (لو موجود) يفضل صالح تاريخيًا في الداتابيز
  await db.promotion.updateMany({
    where: { id: { in: ["promo-buy2get1", "promo-buy3get2"] } },
    data: { isActive: false },
  })

  await db.promotion.upsert({
    where: { id: "promo-buy2get3" },
    update: { triggerQuantity: 2, freeQuantity: 3, isActive: true },
    create: {
      id: "promo-buy2get3",
      type: "BUY_X_GET_Y_FREE",
      triggerQuantity: 2,
      freeQuantity: 3,
      isActive: true,
    },
  })

  // buy 3 get 5 free
  await db.promotion.upsert({
    where: { id: "promo-buy3get5" },
    update: { triggerQuantity: 3, freeQuantity: 5, isActive: true },
    create: {
      id: "promo-buy3get5",
      type: "BUY_X_GET_Y_FREE",
      triggerQuantity: 3,
      freeQuantity: 5,
      isActive: true,
    },
  })

  console.log("✅ Promotions seeded: buy2get3, buy3get5 (القديمة buy2get1/buy3get2 اتقفلوا)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })