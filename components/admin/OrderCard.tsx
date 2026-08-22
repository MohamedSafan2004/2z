"use client"

import { memo } from "react"

export type OrderItem = {
  id: string
  productNameSnapshot: string
  colorSnapshot: string
  sizeSnapshot: string
  quantity: number
  priceSnapshot: number | string
}

export type OrderUser = {
  name?: string
  phone?: string
  email?: string
}

export type Order = {
  id: string
  status: string
  paymentStatus: string
  paymentMethod: string
  totalAmount: number | string
  discountAmount?: number | string
  promoCode?: string | null
  shippingZone: string | null
  shippingCost: number | string
  createdAt: string
  address: string | null
  phone?: string | null
  guestEmail?: string | null
  invoiceNumber?: number | null
  instapayRef?: string | null
  bostaTrackingNumber?: string | null
  bostaState?: string | null
  items: OrderItem[]
  user?: OrderUser
}

type OrderCardProps = {
  order: Order
  formatDate: (dateStr: string) => string
  statusColor: Record<string, string>
  statusBorder: Record<string, string>
  paymentStatusColor: Record<string, string>
  onPrint: (order: Order) => void
  onUpdateStatus: (orderId: string, status: string) => void
  onConfirmInstapay: (orderId: string) => void
  confirmingId: string | null
  confirmError: { orderId: string; message: string } | null
  onSendToBosta: (orderId: string) => void
  bostaSendingId: string | null
  bostaError: { orderId: string; message: string } | null
  bostaSuccessId: string | null
}

// Type scale ثابت للكارت كله — بدل ما كل نص يبقى له حجم مختلف عشوائي (كان في
// الكارت القديم 8px/9px/10px/11px/12px متلخبطين من غير منطق واضح، صعب القراءة
// خصوصًا على الموبايل). دلوقتي 3 مستويات بس: label صغير، نص ثانوي، نص أساسي.
const FONT = {
  label: "10px",      // عناوين الأقسام (Customer / Items / Status) — uppercase خفيف
  meta: "11px",        // نص ثانوي (تاريخ، إيميل، مرجع)
  body: "13px",         // نص أساسي (اسم العميل، تفاصيل المنتج، الأزرار)
  badge: "10px",        // الـ badges (status pills)
}

// درجات شفافية أعلى من النسخة القديمة (كانت كتير حاجات على 0.3-0.4 وبقت باهتة
// جدًا وصعبة القراءة). النص الأساسي دلوقتي قريب من أبيض صريح، والثانوي مقروء
// بوضوح لكن أقل تركيز من الأساسي — تباين حقيقي مش بس تدرج شكلي.
const TXT = {
  primary: "#f0ede6",
  secondary: "rgba(240,237,230,0.75)",
  tertiary: "rgba(240,237,230,0.5)",
  label: "rgba(240,237,230,0.45)",
}

// React.memo بيمنع إعادة رسم كل كروت الأوردرات لما state خاص بكارت واحد بس يتغير
// (زي confirmingId أو bostaError) — من غير الـ memo ده، أي تحديث زي ده كان بيعمل
// re-render لكل الكروت المعروضة في الصفحة مش الكارت المتأثر بس
function OrderCardComponent({
  order,
  formatDate,
  statusColor,
  statusBorder,
  paymentStatusColor,
  onPrint,
  onUpdateStatus,
  onConfirmInstapay,
  confirmingId,
  confirmError,
  onSendToBosta,
  bostaSendingId,
  bostaError,
  bostaSuccessId,
}: OrderCardProps) {
  const customerPhone = order.phone || order.user?.phone
  const customerName  = order.user?.name || "Guest"
  const customerEmail = order.guestEmail || order.user?.email
  const invoiceNum = order.invoiceNumber
    ? `INV-${String(order.invoiceNumber).padStart(4, "0")}`
    : null

  return (
    <div style={{ border: "1px solid rgba(240,237,230,0.12)", borderRadius: "2px", overflow: "hidden" }}>
      {/* Header — رقم الأوردر والتاريخ على الشمال، الـ badges على اليمين — خلفية خفيفة تفصله عن الجسم */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", padding: "16px 18px", background: "rgba(240,237,230,0.03)", borderBottom: "1px solid rgba(240,237,230,0.1)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
            <p style={{ fontSize: "15px", color: TXT.primary, letterSpacing: "0.04em", margin: 0, fontWeight: 600 }}>#{order.id.slice(0, 8).toUpperCase()}</p>
            {invoiceNum && (
              <span style={{ fontSize: FONT.label, letterSpacing: "0.1em", textTransform: "uppercase", color: TXT.tertiary, border: "1px solid rgba(240,237,230,0.15)", padding: "3px 8px", borderRadius: "2px" }}>
                {invoiceNum}
              </span>
            )}
          </div>
          <p style={{ fontSize: FONT.meta, color: TXT.tertiary, letterSpacing: "0.02em", margin: 0 }}>{formatDate(order.createdAt)}</p>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          {order.promoCode && (
            <span style={{ fontSize: FONT.badge, letterSpacing: "0.04em", padding: "4px 9px", borderRadius: "2px", color: "rgba(110,220,150,1)", background: "rgba(80,200,120,0.1)", border: "1px solid rgba(80,200,120,0.3)", fontWeight: 500 }}>
              🏷 {order.promoCode} · -{Number(order.discountAmount).toLocaleString()} EGP
            </span>
          )}
          <span style={{ fontSize: FONT.badge, letterSpacing: "0.04em", padding: "4px 9px", borderRadius: "2px", fontWeight: 500, color: paymentStatusColor[order.paymentStatus] || TXT.tertiary, background: "rgba(240,237,230,0.04)", border: `1px solid ${paymentStatusColor[order.paymentStatus] || "rgba(240,237,230,0.15)"}` }}>
            Payment · {order.paymentStatus}
          </span>
          <span style={{ fontSize: FONT.badge, letterSpacing: "0.04em", padding: "4px 9px", borderRadius: "2px", fontWeight: 500, color: statusColor[order.status], background: "rgba(240,237,230,0.04)", border: `1px solid ${statusBorder[order.status]}` }}>
            Order · {order.status}
          </span>
        </div>
      </div>

      <div style={{ padding: "18px" }}>

      <div style={{ paddingBottom: "16px", marginBottom: "16px", borderBottom: "1px solid rgba(240,237,230,0.08)" }}>
        <p style={{ fontSize: FONT.label, letterSpacing: "0.15em", textTransform: "uppercase", color: TXT.label, marginBottom: "10px", fontWeight: 600 }}>Customer</p>
        <p style={{ fontSize: FONT.body, color: TXT.primary, marginBottom: "4px", fontWeight: 500 }}>{customerName}</p>
        {customerPhone && <p style={{ fontSize: FONT.meta, color: TXT.secondary, marginBottom: "3px" }}>{customerPhone}</p>}
        {customerEmail && <p style={{ fontSize: FONT.meta, color: TXT.tertiary, marginBottom: "3px" }}>{customerEmail}</p>}
        {order.address && <p style={{ fontSize: FONT.meta, color: TXT.secondary, marginTop: "8px", lineHeight: 1.6 }}>{order.address}</p>}
        {order.shippingZone && (
          <p style={{ fontSize: FONT.meta, color: "rgba(240,190,140,0.9)", marginTop: "6px", letterSpacing: "0.02em" }}>
            📍 {Number(order.shippingCost).toLocaleString()} EGP shipping
          </p>
        )}
      </div>

      <div style={{ paddingBottom: "16px", marginBottom: "16px", borderBottom: "1px solid rgba(240,237,230,0.08)" }}>
        <p style={{ fontSize: FONT.label, letterSpacing: "0.15em", textTransform: "uppercase", color: TXT.label, marginBottom: "10px", fontWeight: 600 }}>Items</p>
        {order.items.map((item: OrderItem) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }}>
            <p style={{ fontSize: FONT.meta, color: TXT.secondary }}>{item.productNameSnapshot} / {item.colorSnapshot} / {item.sizeSnapshot} × {item.quantity}</p>
            <p style={{ fontSize: FONT.meta, color: TXT.tertiary, whiteSpace: "nowrap" }}>{(Number(item.priceSnapshot) * item.quantity).toLocaleString()} EGP</p>
          </div>
        ))}
      </div>

      {/* الإجمالي فوق، الأزرار تحت — مجمعة واحدة مرتبة منطقيًا (Print → دفع → شحن → حالة) بدل صف مبعثر */}
      <div style={{ marginBottom: "16px" }}>
        {order.promoCode && Number(order.discountAmount) > 0 && (
          <p style={{ fontSize: FONT.meta, color: TXT.tertiary, marginBottom: "4px" }}>
            Original: {(Number(order.totalAmount) + Number(order.discountAmount)).toLocaleString()} EGP
          </p>
        )}
        <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", color: TXT.primary, margin: 0 }}>
          {Number(order.totalAmount).toLocaleString()}
          <span style={{ fontSize: "11px", color: TXT.tertiary, fontFamily: "Space Mono, monospace", marginLeft: "6px" }}>EGP</span>
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <button
            onClick={() => onPrint(order)}
            style={{ padding: "9px 14px", fontSize: FONT.meta, letterSpacing: "0.05em", fontFamily: "Space Mono, monospace", cursor: "pointer", background: "transparent", color: TXT.secondary, border: "1px solid rgba(240,237,230,0.2)", borderRadius: "2px" }}
          >
            🖨 Print
          </button>

          {order.paymentMethod === "INSTAPAY" && order.paymentStatus !== "PAID" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
              <button
                onClick={() => onConfirmInstapay(order.id)}
                disabled={confirmingId === order.id}
                style={{ padding: "9px 14px", fontSize: FONT.meta, letterSpacing: "0.05em", fontFamily: "Space Mono, monospace", cursor: confirmingId === order.id ? "not-allowed" : "pointer", background: "rgba(100,200,150,0.12)", color: confirmingId === order.id ? "rgba(100,200,150,0.4)" : "rgba(120,220,170,1)", border: "1px solid rgba(100,200,150,0.4)", borderRadius: "2px", fontWeight: 500 }}
              >
                {confirmingId === order.id ? "..." : "✓ Confirm InstaPay"}
              </button>
              {confirmError?.orderId === order.id && (
                <span style={{ fontSize: FONT.meta, color: "rgba(235,120,120,1)", maxWidth: "220px" }}>
                  {confirmError.message}
                </span>
              )}
            </div>
          )}

          {order.paymentMethod === "INSTAPAY" && order.instapayRef && (
            <span style={{ fontSize: FONT.meta, color: TXT.tertiary, fontFamily: "Space Mono, monospace", alignSelf: "center" }}>
              Ref: {order.instapayRef}
            </span>
          )}

          {!order.bostaTrackingNumber && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
              <button
                onClick={() => onSendToBosta(order.id)}
                disabled={bostaSendingId === order.id}
                style={{ padding: "9px 14px", fontSize: FONT.meta, letterSpacing: "0.05em", fontFamily: "Space Mono, monospace", cursor: bostaSendingId === order.id ? "not-allowed" : "pointer", background: "rgba(120,180,255,0.12)", color: bostaSendingId === order.id ? "rgba(120,180,255,0.4)" : "rgba(140,195,255,1)", border: "1px solid rgba(120,180,255,0.4)", borderRadius: "2px", fontWeight: 500 }}
              >
                {bostaSendingId === order.id ? "Sending..." : "📦 Send to Bosta"}
              </button>
              {bostaError?.orderId === order.id && (
                <span style={{ fontSize: FONT.meta, color: "rgba(235,120,120,1)", maxWidth: "220px" }}>
                  ✗ {bostaError.message}
                </span>
              )}
              {bostaSuccessId === order.id && (
                <span style={{ fontSize: FONT.meta, color: "rgba(120,220,170,1)" }}>
                  ✓ اتبعتت لـ Bosta بنجاح
                </span>
              )}
            </div>
          )}

          {order.bostaTrackingNumber && (
            <span style={{ fontSize: FONT.meta, color: "rgba(140,195,255,1)", fontFamily: "Space Mono, monospace", border: "1px solid rgba(120,180,255,0.3)", padding: "4px 9px", borderRadius: "2px", alignSelf: "center" }}>
              📦 {order.bostaTrackingNumber}{order.bostaState ? ` · ${order.bostaState}` : ""}
            </span>
          )}
        </div>

        {/* الـ status select في صف منفصل بخط فاصل خفيف — لما هو حاجة مختلفة عن أزرار الإجراءات (بيغير الحالة مباشرة بدل ما ينفذ action) */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingTop: "12px", borderTop: "1px solid rgba(240,237,230,0.08)" }}>
          <label style={{ fontSize: FONT.label, letterSpacing: "0.15em", textTransform: "uppercase", color: TXT.label, fontWeight: 600 }}>
            Status
          </label>
          <select value={order.status} onChange={(e) => onUpdateStatus(order.id, e.target.value)} style={{ background: "#111", color: TXT.primary, border: "1px solid rgba(240,237,230,0.2)", padding: "9px 12px", fontSize: FONT.meta, fontFamily: "Space Mono, monospace", cursor: "pointer", letterSpacing: "0.02em", outline: "none", borderRadius: "2px" }}>
            {["PENDING_PAYMENT", "PENDING", "CONFIRMED", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      </div>
    </div>
  )
}

// Custom comparison — بيقارن بس الحاجات اللي فعلاً بتفرق مع الكارت ده بالذات.
// من غير كده memo هيقارن الـ callbacks (onPrint, onUpdateStatus...) اللي بتتغير
// reference بتاعها كل render لو مش متلفوفة بـ useCallback في الصفحة الأب
function areEqual(prev: OrderCardProps, next: OrderCardProps) {
  return (
    prev.order === next.order &&
    (prev.confirmingId === prev.order.id) === (next.confirmingId === next.order.id) &&
    prev.confirmError?.orderId === next.confirmError?.orderId &&
    prev.confirmError?.message === next.confirmError?.message &&
    (prev.bostaSendingId === prev.order.id) === (next.bostaSendingId === next.order.id) &&
    prev.bostaError?.orderId === next.bostaError?.orderId &&
    prev.bostaError?.message === next.bostaError?.message &&
    (prev.bostaSuccessId === prev.order.id) === (next.bostaSuccessId === next.order.id)
  )
}

const OrderCard = memo(OrderCardComponent, areEqual)
export default OrderCard
