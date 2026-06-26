import { NextRequest, NextResponse } from "next/server"
import { syncAllInventory } from "@/lib/sheets-sync"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await syncAllInventory()
  return NextResponse.json({ success: true })
}