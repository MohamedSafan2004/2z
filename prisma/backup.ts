import * as fs from "fs"
import * as dotenv from "dotenv"
import pkg from "pg"
const { Pool } = pkg

dotenv.config()

async function backup() {
  const pool = new Pool({ connectionString: process.env.DIRECT_DATABASE_URL })

  const tables = ["User", "Category", "Product", "ProductVariant", "Order", "OrderItem"]
  const backupData: Record<string, any> = {}

  for (const table of tables) {
    const result = await pool.query(`SELECT * FROM "${table}"`)
    backupData[table] = result.rows
    console.log(`✓ ${table}: ${result.rows.length} rows`)
  }

  const filename = `backup-${new Date().toISOString().split("T")[0]}.json`
  fs.writeFileSync(filename, JSON.stringify(backupData, null, 2))
  console.log(`\n✓ Backup saved to ${filename}`)

  await pool.end()
}

backup().catch(console.error)