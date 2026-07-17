import { db } from "@/lib/db"

export type GiftSelection = {
  variantId: string
}

export type ResolvedGift = {
  variantId: string
  productId: string
  productName: string
  price: number
  color: string
  size: string
}

export type PromotionResult =
  | { applicable: false; freeQuantity: 0 }
  | {
      applicable: true
      triggerQuantity: number
      freeQuantity: number
      gifts: ResolvedGift[]
      discountAmount: number
    }

/**
 * بيحسب عدد القطع الكلي (المدفوعة) اللي العميل حاطها في الكارت،
 * ويرجع أعلى عرض (Promotion) فعّال مستحقه — الأعلى triggerQuantity اللي وصله بس.
 * ملحوظة: العروض متدرجة (tiered) مش تراكمية — يعني 4 قطع بتاخد نفس عرض الـ 3 قطع، مش أكتر.
 */
export async function getEligiblePromotion(paidQuantity: number) {
  if (paidQuantity < 2) return null

  const promotions = await db.promotion.findMany({
    where: { isActive: true, triggerQuantity: { lte: paidQuantity } },
    orderBy: { triggerQuantity: "desc" },
  })

  return promotions[0] ?? null
}

/**
 * بيتحقق من اختيارات الهدية ويحسب الخصم.
 * paidItems: القطع اللي العميل بيدفع فيها فعلياً (من الكارت العادي)
 * giftSelections: الـ variants اللي العميل اختارها كهدية (منفصلة عن الكارت)
 */
export async function calculatePromotion(
  paidItems: { variantId: string; quantity: number }[],
  giftSelections: GiftSelection[]
): Promise<PromotionResult> {
  const paidQuantity = paidItems.reduce((sum, i) => sum + i.quantity, 0)

  const promotion = await getEligiblePromotion(paidQuantity)
  if (!promotion) return { applicable: false, freeQuantity: 0 }

  const { freeQuantity, triggerQuantity } = promotion

  if (giftSelections.length !== freeQuantity) {
    throw new Error(
      `Invalid gift selection: expected ${freeQuantity} gift item(s), got ${giftSelections.length}`
    )
  }

  const giftVariantIds = giftSelections.map((g) => g.variantId)
  const variants = await db.productVariant.findMany({
    where: { id: { in: giftVariantIds } },
    include: { product: true },
  })

  const gifts: ResolvedGift[] = []
  let discountAmount = 0

  for (const variantId of giftVariantIds) {
    const variant = variants.find((v) => v.id === variantId)
    if (!variant) {
      throw new Error(`Gift item not found: ${variantId}`)
    }
    if (!variant.product.isActive) {
      throw new Error(`Gift item unavailable: ${variant.product.name}`)
    }
    if (variant.stockQuantity < 1) {
      throw new Error(`Gift item out of stock: ${variant.product.name} (${variant.color}/${variant.size})`)
    }

    const price = Number(variant.product.price)
    gifts.push({
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.product.name,
      price,
      color: variant.color,
      size: variant.size,
    })
    discountAmount += price
  }

  return {
    applicable: true,
    triggerQuantity,
    freeQuantity,
    gifts,
    discountAmount,
  }
}