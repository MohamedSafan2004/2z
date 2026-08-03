// ─────────────────────────────────────────────────────────────────────────────
// Bosta Webhook — Bosta بتنادي الـ endpoint ده تلقائيًا كل ما حالة شحنة تتغير
// (Picked Up, In Transit, Out for Delivery, Delivered, Returned, Cancelled...).
//
// إعداد مطلوب من جانب محمد: يروح Bosta Dashboard → Settings → Webhooks،
// ويحط الرابط: https://www.2zstore.com/api/bosta/webhook
//
// أمان: بنتحقق إن الأوردر موجود عندنا فعليًا (عن طريق businessReference =
// order.id بتاعنا اللي بعتناه وقت الإنشاء، أو bostaDeliveryId كـ fallback).
// لو الأوردر مش موجود، بنتجاهل الطلب بهدوء من غير error.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { OrderStatus } from "@/app/generated/prisma/client"

// حالات Bosta "النهائية" اللي بتغيّر order.status عندنا فعليًا
const BOSTA_STATE_TO_ORDER_STATUS: Record<string, OrderStatus> = {
  "Delivered": "DELIVERED",
  "delivered": "DELIVERED",
  "Terminated": "CANCELLED",
  "Canceled": "CANCELLED",
  "Cancelled": "CANCELLED",
  "Returned to origin": "CANCELLED",
  "Returned": "CANCELLED",
}

// حالات "الشحنة اتحركت فعليًا" — بترفّع status لـ SHIPPED أول مرة بس
const BOSTA_IN_TRANSIT_STATES = new Set([
  "Picked up",
  "Picked Up",
  "In Transit",
  "In transit",
  "Out for delivery",
  "Out for Delivery",
])

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const delivery = body.delivery || body

    const deliveryId: string | undefined = delivery.id || delivery._id
    const businessReference: string | undefined = delivery.businessReference
    const state: string | undefined = delivery.state?.value || delivery.state || delivery.status

    if (!businessReference && !deliveryId) {
      return NextResponse.json({ error: "Missing delivery reference" }, { status: 400 })
    }

    const order = await db.order.findFirst({
      where: businessReference ? { id: businessReference } : { bostaDeliveryId: deliveryId },
    })

    if (!order) {
      return NextResponse.json({ received: true, matched: false })
    }

    if (!state) {
      return NextResponse.json({ received: true, updatedState: false })
    }

    const mappedStatus = BOSTA_STATE_TO_ORDER_STATUS[state]
    const isInTransit = BOSTA_IN_TRANSIT_STATES.has(state)
    const terminalStates: OrderStatus[] = ["DELIVERED", "CANCELLED"]
    const alreadyTerminal = terminalStates.includes(order.status as OrderStatus)

    const nextStatus: OrderStatus = alreadyTerminal
      ? order.status as OrderStatus
      : mappedStatus
        ? mappedStatus
        : isInTransit && (order.status === "PAID" || order.status === "CONFIRMED")
          ? "SHIPPED"
          : order.status as OrderStatus

    await db.order.update({
      where: { id: order.id },
      data: {
        bostaState: state,
        bostaLastSyncAt: new Date(),
        status: nextStatus,
      },
    })

    return NextResponse.json({ received: true, updatedState: true, status: nextStatus })
  } catch (error) {
    console.error("Bosta webhook error:", error)
    return NextResponse.json({ received: true, error: true })
  }
}
