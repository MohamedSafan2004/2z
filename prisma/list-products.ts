export {}
/// <reference types="node" />
import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      variants: { select: { color: true, sku: true } },
    },
  })

  console.log(JSON.stringify(products, null, 2))

  await pool.end()
}

main().catch(console.error)
