import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth, optionalAuth } from "@/lib/middleware"
import { orderRatelimit } from "@/lib/ratelimit"
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email"
import { sanitize } from "@/lib/validation"
import { getFinalShippingCost, type ShippingZone } from "@/lib/shipping"
import { isValidBostaCity } from "@/lib/cities"
import { calculatePromotion, type GiftSelection } from "@/lib/promotions"
import { sendPurchaseCapiEvent, getRequestMeta } from "@/lib/meta-capi"
import { normalizeEgyptianPhone } from "@/lib/phone"
import crypto from "crypto"

// الكود المرتبط بالـ flash offer popup — لازم يطابق اللي في app/api/leads/subscribe وapp/api/promo/validate
const EMAIL_LINKED_PROMO_CODE = "2ZSAVE10"

type CartItem = { variantId: string; quantity: number } 

export async function POST(req: NextRequest) {
  try {
    const auth = optionalAuth(req)

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
    const { success } = await orderRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: "Too many orders. Please try again later." }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

    const { items, address, city, phone, email, name, clientOrderId, promoCode, paymentMethod, shippingZone, giftSelections, eventId } = body

    if (!items || items.length === 0) return NextResponse.json({ error: "No items in order" }, { status: 400 })
    if (!email || !phone || !address) return NextResponse.json({ error: "Email, phone, and address are required" }, { status: 400 })
    if (!isValidBostaCity(city)) return NextResponse.json({ error: "Please select a valid city" }, { status: 400 })

    const trimmedName = typeof name === "string" ? name.trim() : ""
    if (!trimmedName) return NextResponse.json({ error: "Name is required" }, { status: 400 })

    if (shippingZone !== "egypt") {
      return NextResponse.json({ error: "Invalid delivery zone" }, { status: 400 })
    }

    const method = paymentMethod === "instapay" ? "INSTAPAY" : "COD"

    for (const item of items) {
      if (!item.variantId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
        return NextResponse.json({ error: "Invalid item quantity" }, { status: 400 })
      }
    }

    const giftList: GiftSelection[] = Array.isArray(giftSelections)
      ? giftSelections.filter((g: unknown): g is GiftSelection =>
          typeof g === "object" && g !== null && typeof (g as { variantId?: unknown }).variantId === "string"
        )
      : []

    if (clientOrderId) {
      const existing = await db.order.findFirst({
        where: { clientOrderId },
        include: { items: true },
      })
      if (existing) return NextResponse.json({ ...existing, verifyToken: existing.verifyToken }, { status: 201 })
    }

    const variantIds = items.map((item: CartItem) => item.variantId)
    const variants = await db.productVariant.findMany({
      where: { id: { in: variantIds }, product: { isActive: true } },
      include: { product: true },
    })

    for (const item of items) {
      const variant = variants.find((v: typeof variants[number]) => v.id === item.variantId)
      if (!variant) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const subtotal = items.reduce((total: number, item: CartItem) => {
      const variant = variants.find((v: typeof variants[number]) => v.id === item.variantId)!
      return total + Number(variant.product.price) * item.quantity
    }, 0)

    // ─── Bundle Promotion (buy X get Y free) ─────────────────────────────────
    let promotionDiscount = 0
    let promotionResult: Awaited<ReturnType<typeof calculatePromotion>> | null = null

    try {
      promotionResult = await calculatePromotion(items, giftList)
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid gift selection" },
        { status: 400 }
      )
    }

    if (promotionResult.applicable) {
      promotionDiscount = promotionResult.discountAmount
    } else if (giftList.length > 0) {
      // العميل بعت اختيارات هدية بس مش مستحقها فعلياً — رفض واضح بدل ما نتجاهله بصمت
      return NextResponse.json({ error: "You are not eligible for a free gift with this order" }, { status: 400 })
    }

    // ─── Promo Code ───────────────────────────────────────────────────────────
    let discountAmount = 0
    let validatedPromoCode: string | null = null
    let promoId: string | null = null

    if (promoCode && typeof promoCode === "string") {
      const code = promoCode.trim().toUpperCase()
      const promo = await db.promoCode.findUnique({ where: { code } })

      // صلاحية الـ 48 ساعة للكود المرتبط بالإيميل — نفس الفحص اللي في promo/validate،
      // بس هنا هو الفحص الحقيقي لأن هنا بيتعمل الخصم فعليًا. لو الكود انتهت
      // صلاحيته أو مش مرتبط بالإيميل المبعوت، بنتجاهله بصمت بدل ما نرفض
      // الأوردر كله (الفرونت لو طبّق صح مش هيبعت كود منتهي أصلاً).
      let promoBlockedByExpiry = false
      if (promo && promo.isActive && code === EMAIL_LINKED_PROMO_CODE) {
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : ""
        const lead = normalizedEmail
          ? await db.emailLead.findUnique({
              where: { email: normalizedEmail },
              select: { promoCode: true, codeExpiresAt: true },
            })
          : null
        if (!lead || lead.promoCode !== code || lead.codeExpiresAt.getTime() < Date.now()) {
          promoBlockedByExpiry = true
        }
      }

      if (promo && promo.isActive && !promoBlockedByExpiry) {
        // لازم نطبّع الرقم قبل الفحص والحفظ عشان محدش يقدر يستخدم الكود
        // مرتين بصيغتين مختلفتين لنفس الرقم (زي في promo/validate)
        const normalizedPhone = normalizeEgyptianPhone(phone) ?? phone
        const usedByPhone = await db.promoCodeUsage.findFirst({
          where: { promoCodeId: promo.id, phone: normalizedPhone },
        })
        const usedByUser = auth.userId
          ? await db.promoCodeUsage.findFirst({ where: { promoCodeId: promo.id, userId: auth.userId } })
          : null

        if (!usedByPhone && !usedByUser) {
          // الكود بيتحسب على السعر بعد خصم الـ bundle (تسلسلي مش على الأصلي)
          const afterPromotion = subtotal - promotionDiscount
          discountAmount = Math.round((afterPromotion * promo.discount) / 100)
          validatedPromoCode = promo.code
          promoId = promo.id
        }
      }
    }

    // الفري شيبينج بيتحسب على المبلغ الفعلي اللي العميل هيدفعه في المنتجات (بعد خصم الـ bundle + promo code)
    const amountAfterDiscounts = subtotal - promotionDiscount - discountAmount
    const shippingCost = getFinalShippingCost(shippingZone as ShippingZone, amountAfterDiscounts)
    const totalAmount = subtotal - promotionDiscount - discountAmount + shippingCost
    const user = auth.userId ? await db.user.findUnique({ where: { id: auth.userId } }) : null
    const verifyToken = crypto.randomBytes(32).toString("hex")

    // InstaPay: الأوردر يتحفظ كـ PENDING_PAYMENT لحد ما العميل يبعت رقم الحوالة
    // COD: يتحفظ PENDING عادي
    const initialStatus = method === "INSTAPAY" ? "PENDING_PAYMENT" : "PENDING"

    // كل عمليات خصم الستوك المطلوبة (قطع مدفوعة + هدايا)، مجمعة بالـ variantId
    // عشان لو نفس الـ variant اتطلب كـ item عادي وكـ هدية في نفس الأوردر، يتخصم بالكمية الصح مرة واحدة
    const stockDecrements = new Map<string, number>()
    for (const item of items) {
      stockDecrements.set(item.variantId, (stockDecrements.get(item.variantId) || 0) + item.quantity)
    }
    if (promotionResult?.applicable) {
      for (const gift of promotionResult.gifts) {
        stockDecrements.set(gift.variantId, (stockDecrements.get(gift.variantId) || 0) + 1)
      }
    }

    const order = await db.$transaction(async (tx) => {
      // خصم الستوك بشكل atomic — الشرط stockQuantity >= المطلوب بيتحقق ويتخصم
      // في نفس أمر الـ SQL، فمفيش نافذة زمنية بين "القراءة" و"الكتابة" ممكن
      // يستغلها طلبان متزامنان (race condition). لو count === 0 يبقى مفيش
      // ستوك كافي وقت التنفيذ الفعلي، مش وقت الفحص الأولي.
      for (const [variantId, qty] of stockDecrements) {
        const result = await tx.productVariant.updateMany({
          where: { id: variantId, stockQuantity: { gte: qty } },
          data: { stockQuantity: { decrement: qty } },
        })
        if (result.count === 0) {
          const variant = variants.find((v: typeof variants[number]) => v.id === variantId)
          const giftVariant = promotionResult?.applicable
            ? promotionResult.gifts.find((g) => g.variantId === variantId)
            : undefined
          const name = variant?.product.name || giftVariant?.productName || variantId
          throw new Error(`Not enough stock for ${name}`)
        }
      }

      const counter = await tx.invoiceCounter.update({
        where: { id: 1 },
        data: { lastNum: { increment: 1 } },
      })

      const paidOrderItems = items.map((item: CartItem) => {
        const variant = variants.find((v: typeof variants[number]) => v.id === item.variantId)!
        return {
          variantId: item.variantId,
          quantity: item.quantity,
          productNameSnapshot: variant.product.name,
          priceSnapshot: variant.product.price,
          colorSnapshot: variant.color,
          sizeSnapshot: variant.size,
          isGift: false,
        }
      })

      const giftOrderItems = promotionResult?.applicable
        ? promotionResult.gifts.map((gift) => ({
            variantId: gift.variantId,
            quantity: 1,
            productNameSnapshot: gift.productName,
            priceSnapshot: 0,
            colorSnapshot: gift.color,
            sizeSnapshot: gift.size,
            isGift: true,
          }))
        : []

      const newOrder = await tx.order.create({
        data: {
          ...(auth.userId && { user: { connect: { id: auth.userId } } }),
          invoiceNumber: counter.lastNum,
          totalAmount,
          discountAmount,
          promotionDiscount,
          shippingCost,
          shippingZone,
          promoCode: validatedPromoCode,
          guestEmail: email || null,
          guestName: !auth.userId ? sanitize(trimmedName) : null,
          address: sanitize(address),
          city,
          phone: sanitize(phone),
          clientOrderId: clientOrderId || null,
          verifyToken,
          paymentMethod: method,
          status: initialStatus,
          paymentStatus: "PENDING",
          items: {
            create: [...paidOrderItems, ...giftOrderItems],
          },
        },
        include: { items: true },
      })

      if (promoId && validatedPromoCode) {
        await tx.promoCodeUsage.create({
          data: {
            promoCodeId: promoId,
            userId: auth.userId || null,
            phone: normalizeEgyptianPhone(phone) ?? phone,
          },
        })
      }

      return newOrder
    })

    // لو InstaPay: مفيش إيميلات أو تأكيد لسه — هيتبعتوا بعد ما يبعت الـ ref
    // لو COD: الإيميلات تتبعت فورًا زي العادي
    if (method === "COD") {
      const emailTo = email || user?.email
      const customerName = user?.name || order.guestName || "Guest"
      const invoiceNum = `INV-${String(order.invoiceNumber).padStart(4, "0")}`

      if (emailTo) {
        try {
          await sendOrderConfirmation({
            to: emailTo,
            orderNumber: order.id,
            invoiceNumber: invoiceNum,
            items: order.items.map((item: typeof order.items[number]) => ({
              name: item.productNameSnapshot,
              color: item.colorSnapshot,
              size: item.sizeSnapshot,
              quantity: item.quantity,
              price: Number(item.priceSnapshot),
            })),
            total: totalAmount,
            address: address || "",
            promoCode: validatedPromoCode ?? undefined,
            discountAmount: (discountAmount + promotionDiscount) > 0 ? (discountAmount + promotionDiscount) : undefined,
          })
        } catch (error) {
          console.error("Customer email failed:", error instanceof Error ? error.message : error)
        }
      }

      try {
        await sendAdminNotification({
          orderNumber: order.id,
          invoiceNumber: invoiceNum,
          customerName: customerName,
          customerEmail: emailTo || "",
          customerPhone: phone || "",
          address: address || "",
          items: order.items.map((item: typeof order.items[number]) => ({
            name: item.productNameSnapshot,
            color: item.colorSnapshot,
            size: item.sizeSnapshot,
            quantity: item.quantity,
            price: Number(item.priceSnapshot),
          })),
          total: totalAmount,
          promoCode: validatedPromoCode ?? undefined,
          discountAmount: (discountAmount + promotionDiscount) > 0 ? (discountAmount + promotionDiscount) : undefined,
        })
      } catch (error) {
        console.error("Admin notification failed:", error instanceof Error ? error.message : error)
      }

      // ─── Meta CAPI: Purchase ────────────────────────────────────────────
      // COD بيتأكد فورًا وقت الإنشاء، فده أقرب لحظة حقيقية لـ "الشراء". لو
      // InstaPay، الحدث ده بيتبعت من مكان تاني (admin/orders/[id]/route.ts)
      // وقت ما الأدمن يعمل Confirm InstaPay فعليًا — مش هنا خالص.
      try {
        const { clientIp, userAgent } = getRequestMeta(req)
        await sendPurchaseCapiEvent({
          eventId: typeof eventId === "string" && eventId ? eventId : null,
          email: emailTo,
          phone,
          clientIp,
          userAgent,
          contentIds: order.items.map((item: typeof order.items[number]) => item.variantId),
          value: totalAmount,
          numItems: order.items.reduce((sum: number, item: typeof order.items[number]) => sum + item.quantity, 0),
          orderId: order.id,
        })
      } catch (error) {
        console.error("Meta CAPI Purchase failed:", error instanceof Error ? error.message : error)
      }
    }

    return NextResponse.json({ ...order, verifyToken }, { status: 201 })
  } catch (error) {
    console.error("Order creation error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req)
    if ("error" in auth) return auth.error

    const orders = await db.order.findMany({
      where: { userId: auth.userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Get orders error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
