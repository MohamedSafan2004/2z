import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/middleware"

// Endpoint خفيف مخصوص للأرقام في أعلى صفحة الأدمن (Total, Revenue, عدّ كل status).
// بيستخدم count/groupBy/aggregate بس — من غير items أو user include — عشان يفضل
// سريع حتى لو عدد الأوردرات كبر لآلاف. لازم ينادى منفصل عن /api/admin/orders
// اللي دلوقتي بيرجع صفحة واحدة بس مش كل الأوردرات.
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if ("error" in auth) return auth.error

    const [totalOrders, statusGroups, revenueAgg, awaitingInstapay] = await Promise.all([
      db.order.count(),
      db.order.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.order.aggregate({
        where: { status: { in: ["PAID", "DELIVERED"] } },
        _sum: { totalAmount: true },
      }),
      db.order.count({
        where: {
          paymentMethod: "INSTAPAY",
          paymentStatus: { not: "PAID" },
          status: { not: "CANCELLED" },
        },
      }),
    ])

    const byStatus: Record<string, number> = {}
    for (const group of statusGroups) {
      byStatus[group.status] = group._count._all
    }

    const toShip = (byStatus["PAID"] || 0) + (byStatus["CONFIRMED"] || 0)

    return NextResponse.json({
      totalOrders,
      revenue: Number(revenueAgg._sum.totalAmount || 0),
      awaitingInstapay,
      toShip,
      byStatus,
    })
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
