const STORAGE_KEY = "guest_order_tokens"

type GuestOrderToken = { orderId: string; verifyToken: string; createdAt: number }

export function saveGuestOrderToken(orderId: string, verifyToken: string) {
  if (typeof window === "undefined") return
  try {
    const existing = getGuestOrderTokens()
    const filtered = existing.filter((o) => o.orderId !== orderId)
    const updated = [...filtered, { orderId, verifyToken, createdAt: Date.now() }]
    // نحتفظ بآخر 20 أوردر بس عشان الـ localStorage ميتضخمش
    const trimmed = updated.slice(-20)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage ممكن يكون معطل (private browsing) — نتجاهل بهدوء
  }
}

export function getGuestOrderTokens(): GuestOrderToken[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}