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
  invoiceNumber: number | null
  bostaDeliveryId: string | null
  totalAmount: number | { toString(): string } // Prisma Decimal
  paymentMethod: string
  address: string | null
  city: string | null
  phone: string | null
  guestName: string | null
  user: { name: string | null; email: string | null; phone: string | null } | null
  items: {
    productNameSnapshot: string
    colorSnapshot: string
    sizeSnapshot: string
    quantity: number
    isGift: boolean
  }[]
}

export type BostaSyncResult =
  | { ok: true; trackingNumber: string; state: string | null }
  | { ok: false; reason: "not_configured" | "already_synced" | "missing_fields" | "api_failed"; message: string }

export async function syncOrderToBosta(order: OrderForBosta): Promise<BostaSyncResult> {
  if (!isBostaConfigured()) {
    return { ok: false, reason: "not_configured", message: "BOSTA_API_KEY isn't set on the server" }
  }
  if (order.bostaDeliveryId) {
    return { ok: false, reason: "already_synced", message: "This order was already sent to Bosta" }
  }

  if (!order.address || !order.city || !order.phone) {
    const missing = [!order.address && "address", !order.city && "city", !order.phone && "phone"].filter(Boolean).join(", ")
    console.error(`Bosta sync skipped for order ${order.id}: missing ${missing}`)
    return { ok: false, reason: "missing_fields", message: `Missing ${missing} on this order — edit it before sending` }
  }

  const normalizedPhone = normalizeEgyptianPhone(order.phone) ?? order.phone
  const fullName = (order.user?.name || order.guestName || "Customer").trim()
  const [firstName, ...rest] = fullName.split(" ")
  const lastName = rest.join(" ") || firstName

  // رقم الفاتورة (INV-XXXX) لو مولد لحد دلوقتي — وإلا fallback للـ order.id الداخلي
  // (Prisma CUID) عشان الـ sync ميتعطلش لو لسبب ما invoiceNumber لسه متولدش.
  const displayRef = order.invoiceNumber ? `INV-${String(order.invoiceNumber).padStart(4, "0")}` : order.id

  // وصف المنتجات (لون + مقاس + كمية) — ده بيظهر للعميل حرفيًا في رسالة Bosta
  // الأوتوماتيكية على الواتساب ("تفاصيل طلبك")، فلازم يقوله هو طلب إيه
  // بالظبط عشان يقدر يأكد الاستلام بمعرفة حقيقية مش بس رقم فاتورة.
  // مثال: "Oversize T-Shirt — Black (M) x1" أو "... x2, White (L) x1 [Gift]"
  const itemsDescription = order.items
    .map((item) => {
      const color = item.colorSnapshot.charAt(0) + item.colorSnapshot.slice(1).toLowerCase()
      const giftLabel = item.isGift ? " [Gift]" : ""
      return `${item.productNameSnapshot} — ${color} (${item.sizeSnapshot}) x${item.quantity}${giftLabel}`
    })
    .join(", ")

  const orderDescription = itemsDescription
    ? `${displayRef}: ${itemsDescription}`
    : `2Z Store order ${displayRef}` // fallback نادر لو الأوردر مالوش items لأي سبب

  const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0) || 1

  const result = await createBostaDelivery({
    orderRef: order.id,
    cod: order.paymentMethod === "COD" ? Number(order.totalAmount) : 0,
    itemsCount: totalItemsCount,
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
    notes: orderDescription,
  })

  if (!result.ok) {
    const message = result.reason === "request_failed" ? result.message : result.reason
    console.error(`Bosta delivery creation failed for order ${order.id}:`, message)
    return { ok: false, reason: "api_failed", message: String(message) }
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

  return { ok: true, trackingNumber: result.data.trackingNumber, state: result.data.state }
}
