import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/middleware"
import { syncAllInventory } from "@/lib/sheets-sync"

export async function POST(req: NextRequest) {
  try {
    const auth = requireAdmin(req)
    if ("error" in auth) return auth.error

    await syncAllInventory()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Sync inventory error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}