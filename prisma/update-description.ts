export {}
/// <reference types="node" />
import * as dotenv from "dotenv"
dotenv.config()

import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const NEW_DESCRIPTION = "100% premium interlock cotton, relaxed oversized boxy fit. Designed & made in Cairo, Egypt."

async function main() {
  const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const result = await prisma.product.updateMany({
    data: { description: NEW_DESCRIPTION },
  })

  console.log(`✓ اتحدث الـ description لـ ${result.count} منتج`)

  await pool.end()
}

main().catch(console.error)
