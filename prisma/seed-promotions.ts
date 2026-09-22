import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = (process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL) as string
const adapter = new PrismaPg({ connectionString })
const db = new PrismaClient({ adapter })

async function main() {
  // buy 1 get 1 free — القديمة (buy2get3, buy3get5) بتتقفل هنا بدل ما تتمسح، عشان
  // أي أوردر قديم لسه مرتبط بيها (لو موجود) يفضل صالح تاريخيًا في الداتابيز
  await db.promotion.updateMany({
    where: { id: { in: ["promo-buy2get1", "promo-buy3get2", "promo-buy2get3", "promo-buy3get5"] } },
    data: { isActive: false },
  })

  await db.promotion.upsert({
    where: { id: "promo-buy1get1" },
    update: { triggerQuantity: 1, freeQuantity: 1, isActive: true },
    create: {
      id: "promo-buy1get1",
      type: "BUY_X_GET_Y_FREE",
      triggerQuantity: 1,
      freeQuantity: 1,
      isActive: true,
    },
  })

  console.log("✅ Promotion seeded: buy1get1 (القديمة buy2get1/buy3get2/buy2get3/buy3get5 اتقفلوا)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })