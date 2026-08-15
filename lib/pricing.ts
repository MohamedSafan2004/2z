// ── Tiered quantity discount ──
// خصم بينزاد كل ما العميل يزود قطع في الأوردر، بيتحسب على إجمالي عدد القطع
// (paid items) في الكارت كله — مش شرط تكون نفس اللون ولا نفس المقاس.
//
// لو عايز تغيّر النسب أو الحدود: عدّل TIERS بس، محتاجش تلمس أي ملف تاني —
// checkout API (source of truth الفعلي) والـ UI (cart, checkout, product page)
// كلهم بيقروا من الدالة دي.
//
// مهم: التقييم من الأعلى للأقل (أول tier بيتحقق شرطه بيكسب) — لازم تفضل TIERS
// مرتبة تنازليًا بالـ minQty وإلا المنطق هيتلخبط.
interface Tier {
  minQty: number
  percent: number
}

const TIERS: Tier[] = [
  { minQty: 4, percent: 25 },
  { minQty: 3, percent: 20 },
  { minQty: 2, percent: 15 },
  { minQty: 1, percent: 10 },
]

/**
 * بيرجع نسبة الخصم المستحقة لعدد قطع معين (0 لو مفيش قطع خالص).
 * paidQuantity = إجمالي عدد القطع المدفوعة في الأوردر (مش شامل أي هدايا مجانية).
 */
export function getTierDiscountPercent(paidQuantity: number): number {
  if (!paidQuantity || paidQuantity < 1) return 0
  const tier = TIERS.find((t) => paidQuantity >= t.minQty)
  return tier ? tier.percent : 0
}

/**
 * بيرجع الـ tier القادم (اللي لسه مش متحقق) عشان العرض في الـ UI —
 * زي "هتشتري قطعة كمان وتاخد خصم 30%". null لو العميل وصل لأعلى تير (40%).
 */
export function getNextTier(paidQuantity: number): Tier | null {
  const currentPercent = getTierDiscountPercent(paidQuantity)
  const next = [...TIERS].reverse().find((t) => t.percent > currentPercent)
  return next || null
}

/** كل الـ tiers بترتيب تصاعدي — للعرض في UI (جدول/بار الخصم على صفحة المنتج مثلاً) */
export function getAllTiers(): Tier[] {
  return [...TIERS].sort((a, b) => a.minQty - b.minQty)
}
