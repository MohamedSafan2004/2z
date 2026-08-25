"use client"

// ─────────────────────────────────────────────────────────────────────────
// Meta Pixel (browser-side) helpers.
// كل event بيتبعت بـ eventID موحّد عشان لو الـ CAPI بعت نفس الـ event من
// السيرفر، Meta تعمل dedup وميعدش نفس الأوردر/الحدث مرتين.
// ─────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
    clarity?: (...args: unknown[]) => void
    __fbqReady?: boolean
  }
}

export function generateEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

/**
 * بيتنادى مرة واحدة بس (من الـ MetaPixel component) — مش لازم تستخدمه يدوي.
 * لو fbq('init') لسه ما استقرش (__fbqReady لسه false)، بنأجل النداء بدل ما
 * نضيعه أو نبعته بدري ونسبب الـ "Invalid parameter format" warning في الكونسول.
 */
export function fbqTrack(eventName: string, params?: Record<string, unknown>, eventId?: string, retriesLeft = 20) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return

  if (!window.__fbqReady) {
    if (retriesLeft <= 0) return
    setTimeout(() => fbqTrack(eventName, params, eventId, retriesLeft - 1), 100)
    return
  }

  const options = eventId ? { eventID: eventId } : undefined
  if (options) {
    window.fbq("track", eventName, params || {}, options)
  } else {
    window.fbq("track", eventName, params || {})
  }
}

export function trackViewContent(params: {
  content_ids: string[]
  content_name: string
  content_type?: string
  value: number
  currency?: string
}) {
  fbqTrack("ViewContent", {
    content_ids: params.content_ids,
    content_name: params.content_name,
    content_type: params.content_type || "product",
    value: params.value,
    currency: params.currency || "EGP",
  })
}

export function trackAddToCart(params: {
  content_ids: string[]
  content_name: string
  value: number
  currency?: string
  contents?: { id: string; quantity: number; item_price: number }[]
}) {
  fbqTrack("AddToCart", {
    content_ids: params.content_ids,
    content_name: params.content_name,
    content_type: "product",
    value: params.value,
    currency: params.currency || "EGP",
    contents: params.contents,
  })
}

export function trackInitiateCheckout(params: {
  content_ids: string[]
  value: number
  num_items: number
  currency?: string
}) {
  fbqTrack("InitiateCheckout", {
    content_ids: params.content_ids,
    content_type: "product",
    value: params.value,
    num_items: params.num_items,
    currency: params.currency || "EGP",
  })
}

/**
 * بتتبعت بعد ما الأوردر يتسجل فعليًا (مش وقت الضغط على الزرار بس).
 * eventId لازم يبقى نفسه اللي اتبعت للسيرفر مع الأوردر (order.id غالبًا)
 * عشان الـ CAPI Purchase يتعمله dedup صح.
 */
export function trackPurchase(params: {
  content_ids: string[]
  value: number
  num_items: number
  currency?: string
  eventId: string
}) {
  fbqTrack(
    "Purchase",
    {
      content_ids: params.content_ids,
      content_type: "product",
      value: params.value,
      num_items: params.num_items,
      currency: params.currency || "EGP",
    },
    params.eventId
  )
}

/**
 * بتربط الـ Clarity session الحالية برقم الأوردر/الفاتورة بتاعنا، عن طريق custom tag.
 * الهدف: تقدر تدور في Clarity dashboard بـ Order ID أو رقم الفاتورة وتلاقي
 * الـ session بتاعت العميل ده بالظبط (رحلته من أول ما دخل لحد ما اشترى)،
 * بدل ما يفضل Clarity وMeta Ads مصدرين منفصلين مش مرتبطين ببعض.
 *
 * بتتنادى في نفس اللحظة اللي بتتنادى فيها trackPurchase — بعد ما الأوردر
 * يتسجل فعليًا في الداتابيز، مش وقت الضغط على الزرار بس.
 *
 * ملاحظة: window.clarity ممكن يتأخر شوية في التحميل (Script استراتيجية
 * afterInteractive) — التحقق من typeof بيضمن إننا منكسرش الصفحة لو النداء
 * حصل قبل ما الـ script يخلص تحميل.
 */
export function tagClarityOrder(params: { orderRef: string; invoiceNumber?: string }) {
  if (typeof window === "undefined" || typeof window.clarity !== "function") return
  window.clarity("set", "order_id", params.orderRef)
  if (params.invoiceNumber) {
    window.clarity("set", "invoice_number", params.invoiceNumber)
  }
  // Smart event صريح كمان — بيظهر على الـ timeline بتاع التسجيل نفسه في Clarity
  // (مش بس كـ filter tag)، فيسهل تلاقي لحظة الشراء بالظبط وانت بتتفرج على الـ session
  window.clarity("event", "order_placed")
}

/**
 * بتتبعت لما العميل يسجل إيميله عشان ياخد كود خصم (popup الـ 10%).
 * eventId لازم يبقى نفسه اللي اتبعت للسيرفر مع الـ lead API call عشان الـ dedup.
 */
export function trackLead(params: { eventId: string; value?: number; currency?: string }) {
  fbqTrack(
    "Lead",
    {
      value: params.value ?? 0,
      currency: params.currency || "EGP",
      content_name: "10% Off Popup",
    },
    params.eventId
  )
}