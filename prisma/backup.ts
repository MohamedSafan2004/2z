import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"
import pkg from "pg"
const { Pool } = pkg

dotenv.config()

const TABLES = ["User", "Category", "Product", "ProductVariant", "Order", "OrderItem"]

async function backup() {
  const connectionString = process.env.DIRECT_URL || process.env.DIRECT_DATABASE_URL
  if (!connectionString) {
    throw new Error("DIRECT_URL (or DIRECT_DATABASE_URL) is not set")
  }

  const pool = new Pool({ connectionString })
  const backupData: Record<string, unknown[]> = {}
  let totalRows = 0

  console.log(`\n🔄 Starting backup — ${new Date().toISOString()}\n`)

  try {
    for (const table of TABLES) {
      const result = await pool.query(`SELECT * FROM "${table}"`)
      backupData[table] = result.rows
      totalRows += result.rows.length
      console.log(`✓ ${table}: ${result.rows.length} rows`)
    }

    // نحفظ في مجلد backups منفصل
    const backupsDir = path.join(process.cwd(), "backups")
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true })
    }

    const filename = path.join(
      backupsDir,
      `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
    )

    fs.writeFileSync(filename, JSON.stringify(backupData, null, 2), "utf-8")

    console.log(`\n✓ Total: ${totalRows} rows`)
    console.log(`✓ Saved to ${filename}\n`)
  } finally {
    await pool.end()
  }
}

backup().catch((error) => {
  console.error("Backup failed:", error)
  process.exit(1)
})