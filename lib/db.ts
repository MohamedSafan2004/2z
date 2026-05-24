import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as any

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DIRECT_DATABASE_URL,
  })
  const adapter = new PrismaPg(pool)
  // @ts-ignore
  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}