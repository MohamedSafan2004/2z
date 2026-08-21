import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = (process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL) as string
const adapter = new PrismaPg({ connectionString })
const db = new PrismaClient({ adapter })

async function main() {
  // buy 2 get 1 free
  await db.promotion.upsert({
    where: { id: "promo-buy2get1" },
    update: { triggerQuantity: 2, freeQuantity: 1, isActive: true },
    create: {
      id: "promo-buy2get1",
      type: "BUY_X_GET_Y_FREE",
      triggerQuantity: 2,
      freeQuantity: 1,
      isActive: true,
    },
  })

  // buy 3 get 2 free
  await db.promotion.upsert({
    where: { id: "promo-buy3get2" },
    update: { triggerQuantity: 3, freeQuantity: 2, isActive: true },
    create: {
      id: "promo-buy3get2",
      type: "BUY_X_GET_Y_FREE",
      triggerQuantity: 3,
      freeQuantity: 2,
      isActive: true,
    },
  })

  console.log("✅ Promotions seeded: buy2get1, buy3get2")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })