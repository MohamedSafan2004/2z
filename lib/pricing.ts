// ── Tiered quantity discount ── [معطّل حاليًا بطلب من محمد] ──
// العرض ده ("buy more save more") اتشال كاملاً — UI في checkout/product page/cart
// والحساب في checkout API. الدوال تحت راجعة دايمًا 0 عشان أي ملف لسه بيعمل
// import من هنا يفضل يشتغل من غير ما يكسر.
//
// لإرجاع العرض: رجّع TIERS للقيم القديمة المحفوظة تحت، وشيل conditional
// الإخفاء من الـ UI في checkout/page.tsx وComponents\ProductDetailClient.tsx.
interface Tier {
  minQty: number
  percent: number
}

// const TIERS: Tier[] = [
//   { minQty: 4, percent: 25 },
//   { minQty: 3, percent: 20 },
//   { minQty: 2, percent: 15 },
//   { minQty: 1, percent: 10 },
// ]

/**
 * معطّل — بيرجع 0 دايمًا. خصم الكمية موقف بطلب من محمد — التوقيعة موجودة
 * فوق لو قررنا نرجعه.
 */
export function getTierDiscountPercent(_paidQuantity: number): number {
  return 0
}

/**
 * معطّل — بيرجع null دايمًا طالما مفيش tiers فعّالة.
 */
export function getNextTier(_paidQuantity: number): Tier | null {
  return null
}

/** معطّل — بيرجع مصفوفة فارغة دايمًا. */
export function getAllTiers(): Tier[] {
  return []
}
