import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { syncAllInventory } from "@/lib/sheets-sync"

function isValidCronSecret(authHeader: string | null): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected || !authHeader) return false

  const expectedHeader = `Bearer ${expected}`
  const a = Buffer.from(authHeader)
  const b = Buffer.from(expectedHeader)

  // طول مختلف = مش مطابق؛ timingSafeEqual بتطلع لو الطول متطابق قبل ما
  // تقارن المحتوى، فلازم نتحقق من الطول أول وإلا هترمي exception
  if (a.length !== b.length) return false

  return timingSafeEqual(a, b)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!isValidCronSecret(authHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await syncAllInventory()
  return NextResponse.json({ success: true })
}