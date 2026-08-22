import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/middleware"
import type { OrderStatus } from "@/app/generated/prisma/client"

const VALID_STATUSES = ["PENDING_PAYMENT", "PENDING", "CONFIRMED", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]
const MAX_LIMIT = 100
const DEFAULT_LIMIT = 20

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if ("error" in auth) return auth.error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")?.trim() || ""

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    // page/limit جايين كـ نصوص من الـ URL، لازم نتأكد إنهم أرقام صحيحة وموجبة
    // قبل ما نستخدمهم في take/skip — رقم غلط أو سالب هيكسر الـ query
    const pageParam = Number(searchParams.get("page"))
    const limitParam = Number(searchParams.get("limit"))
    const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1
    const limit = Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_LIMIT)
      : DEFAULT_LIMIT

    const where = {
      ...(status && { status: status as OrderStatus }),
      ...(search && {
        OR: [
          { id: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
          { guestEmail: { contains: search, mode: "insensitive" as const } },
          { address: { contains: search, mode: "insensitive" as const } },
          { promoCode: { contains: search, mode: "insensitive" as const } },
          { user: { name: { contains: search, mode: "insensitive" as const } } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
          { user: { phone: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    }

    const [orders, totalCount] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      db.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      page,
    })
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}