// ─────────────────────────────────────────────────────────────────────────────
// Bosta Integration Layer — جاهزة بالكامل لحد ما نتربط بالـ API فعليًا.
//
// دلوقتي مفيش أي كود تاني في المشروع بينادي على الدوال دي — الطبقة دي "نايمة"
// (dormant) لحد ما نحصل على BOSTA_API_KEY فعليًا ونحطه في الـ .env. كل دالة بترجع
// { ok: false, reason: "not_configured" } لو المفتاح مش موجود بدل ما تكسر أو تطلع
// error غامض، عشان أي حد يستخدمها بعدين (checkout, admin dashboard, webhook) يقدر
// يتعامل مع الحالة دي بسهولة من غير ما يحتاج يعرف تفاصيل Bosta الداخلية.
//
// المرجع: Bosta REST API + الـ SDKs الرسمية (Node/Python/PHP) — بترجع نفس شكل
// البيانات تقريبًا. لو الـ payload الفعلي اختلف شوية وقت التفعيل الحقيقي، عدّل
// الـ types والـ endpoints هنا بس — الباقي (Order fields, admin UI hooks) هيفضل زي ما هو.
// ─────────────────────────────────────────────────────────────────────────────

const BOSTA_BASE_URL = process.env.BOSTA_BASE_URL || "https://app.bosta.co/api/v2"
const BOSTA_API_KEY = process.env.BOSTA_API_KEY

export function isBostaConfigured(): boolean {
  return Boolean(BOSTA_API_KEY)
}

type BostaResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "not_configured" }
  | { ok: false; reason: "request_failed"; status: number; message: string }

type BostaAddress = {
  city: string       // اسم المدينة أو الـ city code بتاع Bosta (زي "EG-01")
  zone?: string
  district?: string
  firstLine: string  // العنوان بالتفصيل (شارع/رقم عمارة/إلخ)
}

type BostaReceiver = {
  firstName: string
  lastName: string
  phone: string       // لازم يبدأ بـ 01 وطول 11 رقم
  email?: string
}

export type BostaCreateDeliveryInput = {
  orderRef: string          // بنبعت order.id بتاعنا كـ reference — يرجعلنا في الـ webhook
  cod: number                // المبلغ المطلوب تحصيله (0 لو InstaPay/مدفوع مقدمًا)
  dropOffAddress: BostaAddress
  receiver: BostaReceiver
  notes?: string
}

export type BostaDelivery = {
  id: string
  trackingNumber: string
  state: string
  createdAt: string
}

export type BostaTrackingUpdate = {
  state: string
  timestamp: string
  description?: string
}

async function bostaFetch<T>(path: string, options: RequestInit = {}): Promise<BostaResult<T>> {
  if (!BOSTA_API_KEY) {
    return { ok: false, reason: "not_configured" }
  }

  try {
    const res = await fetch(`${BOSTA_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: BOSTA_API_KEY,
        ...options.headers,
      },
    })

    if (!res.ok) {
      const message = await res.text().catch(() => res.statusText)
      return { ok: false, reason: "request_failed", status: res.status, message }
    }

    const data = (await res.json()) as T
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      reason: "request_failed",
      status: 0,
      message: error instanceof Error ? error.message : "Network error",
    }
  }
}

// ─── إنشاء شحنة جديدة عند Bosta ─────────────────────────────────────────────
// بيتنادى بعد ما الأوردر يتأكد (COD مباشرة، أو InstaPay بعد ما الأدمن يعمل Confirm).
export async function createBostaDelivery(input: BostaCreateDeliveryInput): Promise<BostaResult<BostaDelivery>> {
  return bostaFetch<BostaDelivery>("/deliveries", {
    method: "POST",
    body: JSON.stringify({
      type: 10, // Bosta: "Send" delivery type
      specs: { packageDetails: { itemsCount: 1, description: input.notes || "2Z Store order" } },
      cod: input.cod,
      dropOffAddress: input.dropOffAddress,
      receiver: input.receiver,
      businessReference: input.orderRef,
    }),
  })
}

// ─── جلب حالة شحنة معينة (بديل للـ webhook أو استخدام يدوي من الأدمن) ────────
export async function trackBostaDelivery(deliveryId: string): Promise<BostaResult<BostaTrackingUpdate[]>> {
  return bostaFetch<BostaTrackingUpdate[]>(`/deliveries/${deliveryId}/track`, {
    method: "GET",
  })
}

// ─── طباعة بوليصة الشحن (Airway Bill) ───────────────────────────────────────
export async function printBostaAWB(deliveryIds: string[]): Promise<BostaResult<{ url: string }>> {
  return bostaFetch<{ url: string }>("/deliveries/awb", {
    method: "POST",
    body: JSON.stringify({ deliveryIds }),
  })
}

// ─── إلغاء شحنة (لو الأدمن كنسل الأوردر بعد ما اتبعت لـ Bosta) ──────────────
export async function cancelBostaDelivery(deliveryId: string): Promise<BostaResult<{ success: boolean }>> {
  return bostaFetch<{ success: boolean }>(`/deliveries/${deliveryId}/terminate`, {
    method: "PUT",
  })
}

// ─── تحديث بيانات المستلم/العنوان قبل ما الشحنة تتحرك ───────────────────────
export async function updateBostaDelivery(
  deliveryId: string,
  updates: Partial<Pick<BostaCreateDeliveryInput, "receiver" | "dropOffAddress" | "cod">>
): Promise<BostaResult<BostaDelivery>> {
  return bostaFetch<BostaDelivery>(`/deliveries/${deliveryId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  })
}
