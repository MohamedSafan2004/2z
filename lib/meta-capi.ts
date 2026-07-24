import crypto from "crypto"

// ─────────────────────────────────────────────────────────────────────────
// Meta Conversions API (server-side).
// بيبعت نفس الأحداث اللي الـ Pixel بيبعتها، بس من السيرفر — عشان يرجع
// الداتا اللي بتضيع بسبب Ad Blockers أو iOS ATT.
//
// env vars مطلوبة:
//   META_PIXEL_ID
//   META_CAPI_ACCESS_TOKEN   (System User token من Meta Business Manager)
//   META_TEST_EVENT_CODE     (اختياري — للتست في Events Manager)
// ─────────────────────────────────────────────────────────────────────────

const PIXEL_ID = process.env.META_PIXEL_ID || "1053292133816022"
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE
const GRAPH_VERSION = "v21.0"

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex")
}

export interface CapiUserData {
  email?: string
  phone?: string
  clientIp?: string
  userAgent?: string
  fbp?: string
  fbc?: string
}

interface CapiEventParams {
  eventName: "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase"
  eventId: string
  eventSourceUrl: string
  actionSource?: "website"
  user: CapiUserData
  customData?: Record<string, unknown>
}

/**
 * بتبعت حدث واحد لـ Meta CAPI. لو الـ ACCESS_TOKEN مش متظبط في الـ env،
 * بترجع بصمت (no-op) عشان متكسرش الأوردر لو الإعداد لسه ماخلصش.
 */
export async function sendCapiEvent({
  eventName,
  eventId,
  eventSourceUrl,
  actionSource = "website",
  user,
  customData,
}: CapiEventParams): Promise<void> {
  if (!ACCESS_TOKEN) {
    console.warn("[meta-capi] META_CAPI_ACCESS_TOKEN not set — skipping CAPI event:", eventName)
    return
  }

  const userData: Record<string, string | string[]> = {}
  if (user.email) userData.em = [sha256(user.email)]
  if (user.phone) {
    // رقم مصري 01XXXXXXXXX → لازم E.164 قبل الـ hashing (+20...)
    const normalized = user.phone.startsWith("0") ? `20${user.phone.slice(1)}` : user.phone
    userData.ph = [sha256(normalized)]
  }
  if (user.clientIp) userData.client_ip_address = user.clientIp
  if (user.userAgent) userData.client_user_agent = user.userAgent
  if (user.fbp) userData.fbp = user.fbp
  if (user.fbc) userData.fbc = user.fbc

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: eventSourceUrl,
        action_source: actionSource,
        user_data: userData,
        custom_data: customData || {},
      },
    ],
    ...(TEST_EVENT_CODE && { test_event_code: TEST_EVENT_CODE }),
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )
    if (!res.ok) {
      const errText = await res.text()
      console.error("[meta-capi] Event failed:", eventName, res.status, errText)
    }
  } catch (error) {
    console.error("[meta-capi] Request error:", eventName, error)
  }
}

/** بتلقط الـ IP وuser-agent من request headers — استخدمها في API routes. */
export function getRequestMeta(req: Request): { clientIp?: string; userAgent?: string } {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined
  const userAgent = req.headers.get("user-agent") || undefined
  return { clientIp, userAgent }
}