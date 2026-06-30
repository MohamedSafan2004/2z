import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { optionalAuth } from "@/lib/middleware"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const verifyToken = req.nextUrl.searchParams.get("token")

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    const auth = optionalAuth(req)
    const isOwner = auth.userId && order.userId === auth.userId
    const isAdmin = auth.role === "ADMIN"
    const hasValidToken = verifyToken && order.verifyToken === verifyToken

    if (!isOwner && !isAdmin && !hasValidToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Get order error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}