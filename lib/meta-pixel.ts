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
  }
}

export function generateEventId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

/** بيتنادى مرة واحدة بس (من الـ MetaPixel component) — مش لازم تستخدمه يدوي. */
export function fbqTrack(eventName: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return
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