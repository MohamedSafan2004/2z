import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/middleware"

const MAX_ITEMS = 30
const MAX_QTY = 99
const MAX_MONEY = 1_000_000

class EditError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

type EditItemInput = {
  id?: string
  variantId: string
  quantity: number
  unitPrice: number
}

function isMoney(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= MAX_MONEY
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function parseItems(raw: unknown): EditItemInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ITEMS) return null

  const items: EditItemInput[] = []
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) return null
    const { id, variantId, quantity, unitPrice } = entry as Record<string, unknown>

    if (typeof variantId !== "string" || !variantId) return null
    if (id !== undefined && id !== null && typeof id !== "string") return null
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) return null
    if (!isMoney(unitPrice)) return null

    items.push({
      id: typeof id === "string" && id ? id : undefined,
      variantId,
      quantity,
      unitPrice,
    })
  }

  // نفس الـ item ميتكررش مرتين في نفس الطلب
  const existingIds = items.filter((i) => i.id).map((i) => i.id as string)
  if (new Set(existingIds).size !== existingIds.length) return null

  return items
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(req)
    if ("error" in auth) return auth.error

    const { id } = await params

    let body: Record<string, unknown>
    try {
      body = (await req.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const items = parseItems(body?.items)
    const shippingCost = body?.shippingCost
    const discountAmount = body?.discountAmount

    if (!items) return NextResponse.json({ error: "Invalid items" }, { status: 400 })
    if (!isMoney(shippingCost)) return NextResponse.json({ error: "Invalid shipping cost" }, { status: 400 })
    if (!isMoney(discountAmount)) return NextResponse.json({ error: "Invalid discount" }, { status: 400 })

    const updated = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } })
      if (!order) throw new EditError("Order not found", 404)
      if (order.status === "CANCELLED") throw new EditError("مينفعش تعدل أوردر ملغي", 400)

      const existingById = new Map(order.items.map((item) => [item.id, item]))

      // الأصناف الموجودة أصلاً لازم تكون تابعة للأوردر ده ونفس الـ variant — لو عايز تغير
      // المقاس/اللون امسح الصنف وضيف واحد جديد
      for (const item of items) {
        if (!item.id) continue
        const existing = existingById.get(item.id)
        if (!existing) throw new EditError("صنف مش تابع للأوردر ده")
        if (existing.variantId !== item.variantId) throw new EditError("مينفعش تغير المقاس/اللون لصنف موجود — امسحه وضيف واحد جديد")
      }

      // ─── المخزون: الفرق بين اللي كان محجوز للأوردر واللي هيبقى محجوز بعد التعديل ───
      // delta موجب = محتاج مخزون زيادة، سالب = بنرجع مخزون
      const stockDelta = new Map<string, number>()
      for (const old of order.items) {
        stockDelta.set(old.variantId, (stockDelta.get(old.variantId) ?? 0) - old.quantity)
      }
      for (const item of items) {
        stockDelta.set(item.variantId, (stockDelta.get(item.variantId) ?? 0) + item.quantity)
      }

      // الأصناف الجديدة محتاجة بيانات الـ variant عشان نحفظ snapshot
      const newVariantIds = [...new Set(items.filter((i) => !i.id).map((i) => i.variantId))]
      const variants = newVariantIds.length
        ? await tx.productVariant.findMany({
            where: { id: { in: newVariantIds } },
            include: { product: true },
          })
        : []
      const variantById = new Map(variants.map((v) => [v.id, v]))

      for (const [variantId, delta] of stockDelta) {
        if (delta > 0) {
          const result = await tx.productVariant.updateMany({
            where: { id: variantId, stockQuantity: { gte: delta } },
            data: { stockQuantity: { decrement: delta } },
          })
          if (result.count === 0) throw new EditError("المخزون مش كفاية لأحد الأصناف")
        } else if (delta < 0) {
          await tx.productVariant.update({
            where: { id: variantId },
            data: { stockQuantity: { increment: -delta } },
          })
        }
      }

      // ─── الأصناف: مسح اللي اتشال، تحديث الموجود، إضافة الجديد ───
      const keptIds = items.filter((i) => i.id).map((i) => i.id as string)
      await tx.orderItem.deleteMany({
        where: { orderId: id, id: { notIn: keptIds } },
      })

      let subtotal = 0

      for (const item of items) {
        if (item.id) {
          const existing = existingById.get(item.id)!
          // الهدية سعرها 0 دايماً
          const price = existing.isGift ? 0 : item.unitPrice
          await tx.orderItem.update({
            where: { id: item.id },
            data: { quantity: item.quantity, priceSnapshot: price },
          })
          subtotal += price * item.quantity
        } else {
          const variant = variantById.get(item.variantId)
          if (!variant) throw new EditError("Variant not found")
          await tx.orderItem.create({
            data: {
              order: { connect: { id } },
              variant: { connect: { id: variant.id } },
              productNameSnapshot: variant.product.name,
              priceSnapshot: item.unitPrice,
              colorSnapshot: variant.color,
              sizeSnapshot: variant.size,
              quantity: item.quantity,
            },
          })
          subtotal += item.unitPrice * item.quantity
        }
      }

      if (discountAmount > subtotal) throw new EditError("الخصم أكبر من إجمالي الأصناف")

      const totalAmount = round2(subtotal - discountAmount + shippingCost)

      console.log(
        `[admin-order-edit] order=${id} total ${Number(order.totalAmount)} -> ${totalAmount} | shipping ${Number(order.shippingCost)} -> ${shippingCost} | discount ${Number(order.discountAmount)} -> ${discountAmount}`
      )

      return tx.order.update({
        where: { id },
        data: { totalAmount, shippingCost, discountAmount },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: true,
        },
      })
    }, { timeout: 30000 })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof EditError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Edit order error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
