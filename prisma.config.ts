import path from "path"
import fs from "fs"

// قرا الـ .env يدوياً
const envPath = path.resolve(process.cwd(), ".env")
const envContent = fs.readFileSync(envPath, "utf-8")
const match = envContent.match(/DIRECT_DATABASE_URL="?([^"\n]+)"?/)
const directUrl = match?.[1] ?? ""

import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
})