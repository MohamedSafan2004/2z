export type ShippingZone = "cairo" | "giza"

export const SHIPPING_RATES: Record<ShippingZone, number> = {
  cairo: 80,
  giza: 50,
}

export const SHIPPING_LABELS: Record<ShippingZone, string> = {
  cairo: "Cairo",
  giza: "Giza",
}

// ── Free shipping threshold ──
// لو عايز تشيل الفري شيبينج خالص: خليه null
// لو عايز تغير الحد (دلوقتي 1000 جنيه): عدّل الرقم بس
// محتاجش تلمس أي ملف تاني في المشروع — كل مكان بيستخدمه بيجيبه من هنا
// (checkout API والبانرات في الواجهة التلاتا بيقروه من هنا أو من الـ API endpoint الجديد).
export const FREE_SHIPPING_THRESHOLD: number | null = 1000

export function getShippingCost(zone: string | null | undefined): number {
  if (zone === "cairo" || zone === "giza") return SHIPPING_RATES[zone]
  return 0
}

/**
 * بيحسب تكلفة الشحن الفعلية بعد مراعاة الفري شيبينج.
 * subtotal = إجمالي قيمة المنتجات المدفوعة قبل الشحن (مش شامل الخصومات)
 */
export function getFinalShippingCost(zone: string | null | undefined, subtotal: number): number {
  const baseCost = getShippingCost(zone)
  if (FREE_SHIPPING_THRESHOLD !== null && subtotal >= FREE_SHIPPING_THRESHOLD) return 0
  return baseCost
}
