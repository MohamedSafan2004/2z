// المصدر الوحيد لتعريف عروض الهدايا (Buy X Get Y Free) في الفرونت إند —
// product page, cart, checkout لازم ياخدوا منه بدل ما كل صفحة تكرر
// الأرقام بنفسها. كان فيه باج حقيقي حصل بالظبط بسبب التكرار ده: صفحة
// الـ Cart كانت لسه شايلة صيغة قديمة (Buy 2 Get 1 / Buy 3 Get 2) بعد ما
// العروض اتغيرت لـ Buy 2 Get 3 / Buy 3 Get 5 في صفحة المنتج، فكانت بتمسح
// هدايا العميل بمجرد ما يوصل الـ Cart لأنها بتحسب "عدد الهدايا المستحقة"
// غلط.
//
// لازم يتطابق دايمًا مع الـ Promotion rows الفعّالة (isActive: true) في
// الداتابيز — شوف prisma/seed-promotions.ts. لو غيّرت هنا لازم تغيّر
// هناك كمان (والعكس)، والسيرفر (lib/promotions.ts → getEligiblePromotion)
// هو المصدر الحقيقي النهائي وقت إنشاء الأوردر على أي حال — القيم هنا
// بس للـ UI/preview قبل ما الطلب يتبعت.
export interface GiftTier {
  triggerQuantity: number
  freeQuantity: number
}

export const GIFT_TIERS: GiftTier[] = [
  { triggerQuantity: 2, freeQuantity: 3 },
  { triggerQuantity: 3, freeQuantity: 5 },
].sort((a, b) => b.triggerQuantity - a.triggerQuantity)

/** أعلى تير مستحق حاليًا (تيرد مش تراكمي — الأعلى بس اللي العميل وصله) */
export function getEligibleGiftTier(paidQuantity: number): GiftTier | null {
  return GIFT_TIERS.find((t) => paidQuantity >= t.triggerQuantity) ?? null
}

/** أقرب تير جاي لسه معملوش unlock */
export function getNextGiftTier(paidQuantity: number): GiftTier | null {
  return GIFT_TIERS.slice()
    .sort((a, b) => a.triggerQuantity - b.triggerQuantity)
    .find((t) => t.triggerQuantity > paidQuantity) ?? null
}
