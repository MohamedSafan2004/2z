// ─────────────────────────────────────────────────────────────────────────────
// Bosta Order Sync — الطبقة اللي فعليًا بتربط أوردر عندنا بشحنة عند Bosta.
//
// بتتنادى مرة واحدة بس، أول لحظة الأوردر يبقى مؤكد الدفع فعليًا (COD auto-confirm
// أو InstaPay confirm) — نفس التوقيت اللي بيحصل فيه Google Sheets sync بالظبط.
//
// لو BOSTA_API_KEY مش موجود، أو فشل الطلب، أو الأوردر أصلاً عنده شحنة، الدالة
// بترجع من غير ما تعمل throw — عشان فشل الشحن مايكسرش الـ order confirmation
// نفسه (نفس فلسفة syncToSheets وsendPurchaseCapiEvent في باقي المشروع).
// ─────────────────────────────────────────────────────────────────────────────

import { db } from "@/lib/db"
import { createBostaDelivery, isBostaConfigured } from "@/lib/bosta"
import { normalizeEgyptianPhone } from "@/lib/phone"

type OrderForBosta = {
  id: string
  bostaDeliveryId: string | null
  totalAmount: number | { toString(): string } // Prisma Decimal
  paymentMethod: string
  address: string | null
  city: string | null
  phone: string | null
  guestName: string | null
  user: { name: string | null; email: string | null; phone: string | null } | null
}

export async function syncOrderToBosta(order: OrderForBosta): Promise<void> {
  if (!isBostaConfigured()) return
  if (order.bostaDeliveryId) return // اتربط قبل كده، متكررش

  if (!order.address || !order.city || !order.phone) {
    console.error(`Bosta sync skipped for order ${order.id}: missing address/city/phone`)
    return
  }

  const normalizedPhone = normalizeEgyptianPhone(order.phone) ?? order.phone
  const fullName = (order.user?.name || order.guestName || "Customer").trim()
  const [firstName, ...rest] = fullName.split(" ")
  const lastName = rest.join(" ") || firstName

  const result = await createBostaDelivery({
    orderRef: order.id,
    cod: order.paymentMethod === "COD" ? Number(order.totalAmount) : 0,
    dropOffAddress: {
      city: order.city,
      firstLine: order.address,
    },
    receiver: {
      firstName,
      lastName,
      phone: normalizedPhone,
      email: order.user?.email || undefined,
    },
    notes: `2Z Store order ${order.id}`,
  })

  if (!result.ok) {
    console.error(`Bosta delivery creation failed for order ${order.id}:`, result.reason === "request_failed" ? result.message : result.reason)
    return
  }

  await db.order.update({
    where: { id: order.id },
    data: {
      bostaDeliveryId: result.data.id,
      bostaTrackingNumber: result.data.trackingNumber,
      bostaState: result.data.state,
      bostaCreatedAt: new Date(),
      bostaLastSyncAt: new Date(),
    },
  })
}
