"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { trackPurchase, generateEventId } from "@/lib/meta-pixel"

const WHATSAPP_NUMBER = "201114833377" // 011 1483 3377 بصيغة دولية بدون +

type InstapayOrder = {
  id: string
  invoiceNumber: number | null
  totalAmount: number | string
  paymentStatus: string
  guestEmail: string | null
  instapayRef: string | null
  status: string
}

export default function InstapayPaymentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const verifyToken = searchParams.get("token") || ""
  // event_id جاي من صفحة الـ checkout (?eid=) عشان يبقى نفسه بين الـ Pixel
  // والـ CAPI؛ لو مش موجود (مثلاً العميل رجع للصفحة من رابط قديم) بنولّد واحد جديد
  const purchaseEventIdRef = useRef(searchParams.get("eid") || generateEventId())
  const trackedPurchaseRef = useRef(false)

  const [order, setOrder] = useState<InstapayOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [proofSent, setProofSent] = useState(false)
  const [refInput, setRefInput] = useState("")
  const [refError, setRefError] = useState("")
  const [refSubmitting, setRefSubmitting] = useState(false)
  const [refSubmitted, setRefSubmitted] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}?token=${verifyToken}`)
        if (!res.ok) { setError("Order not found"); return }
        const data = await res.json()
        setOrder(data)
        if (data.paymentStatus === "PAID") setProofSent(true)
        if (data.instapayRef) { setProofSent(true); setRefSubmitted(true) }
      } catch {
        setError("Something went wrong")
      } finally {
        setLoading(false)
      }
    }
    if (orderId) fetchOrder()
  }, [orderId, verifyToken])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleSubmitRef = async () => {
    if (refSubmitting) return
    const trimmed = refInput.trim()
    if (trimmed.length < 6) {
      setRefError("Please enter a valid InstaPay reference number")
      return
    }

    setRefSubmitting(true)
    setRefError("")

    try {
      const eventId = purchaseEventIdRef.current
      const res = await fetch(`/api/orders/${orderId}/submit-instapay-ref`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instapayRef: trimmed, verifyToken, eventId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRefError(data.error || "Something went wrong")
        return
      }
      setOrder((prev) => (prev ? { ...prev, instapayRef: trimmed, status: "PENDING" } : prev))
      setRefSubmitted(true)
      setProofSent(true)

      // ─── Meta Pixel: Purchase ─────────────────────────────────────────
      // دي لحظة تأكيد دفع موثقة فعلًا (رقم الحوالة اتسجل) مش
      // مجرد ضغطة واتساب (العميل ممكن يقفل من غير ما يبعت). نفس event_id
      // بيتبعت للسيرفر فوق عشان الـ CAPI Purchase يعمل dedup صح.
      if (!trackedPurchaseRef.current) {
        trackedPurchaseRef.current = true
        trackPurchase({
          content_ids: [orderId],
          value: amount,
          num_items: 1,
          eventId,
        })
      }
    } catch {
      setRefError("Something went wrong")
    } finally {
      setRefSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace" }}>
      <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)" }}>Loading...</p>
    </div>
  )

  if (error || !order) return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace", gap: "16px" }}>
      <p style={{ fontSize: "11px", color: "rgba(240,237,230,0.5)" }}>{error || "Order not found"}</p>
      <button onClick={() => router.push("/")} style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#f0ede6", border: "1px solid rgba(240,237,230,0.3)", padding: "12px 24px", background: "transparent", cursor: "pointer" }}>Back Home</button>
    </div>
  )

  const invoiceNum = order.invoiceNumber ? `INV-${String(order.invoiceNumber).padStart(4, "0")}` : `#${order.id.slice(0, 8).toUpperCase()}`
  const amount = Number(order.totalAmount)

  const whatsappMessage = encodeURIComponent(
    `Hi, I've made an InstaPay transfer for order ${invoiceNum}.\nAmount: ${amount} EGP\nI'm attaching the payment screenshot.`
  )
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`

  const handleWhatsappClick = () => {
    setProofSent(true)
    window.open(whatsappLink, "_blank")
    // ملاحظة: الـ Purchase بيتبعت من handleSubmitRef بعد نجاح إرسال رقم
    // الحوالة مش من هنا — ضغطة الواتساب لوحدها مش دليل إن العميل
    // دفع فعلًا (ممكن يقفل من غير ما يبعت).
  }

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "80px 24px 60px" }}>

        <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "6px" }}>{invoiceNum}</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "#f0ede6", marginBottom: "8px" }}>
          {order.paymentStatus === "PAID" ? "Payment Confirmed" : proofSent ? "Almost There" : "Complete Your Payment"}
        </h1>

        {order.paymentStatus === "PAID" ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(100,200,150,0.12)", border: "1px solid rgba(100,200,150,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(100,200,150,0.9)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p style={{ fontSize: "11px", color: "rgba(240,237,230,0.6)", lineHeight: 1.8, marginBottom: "32px" }}>
              Your payment for order {invoiceNum} has been confirmed. Thank you!
            </p>
            <button
              onClick={() => router.push(order.guestEmail ? `/order-confirmed?email=${encodeURIComponent(order.guestEmail)}` : "/orders")}
              style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#080808", background: "#f0ede6", border: "none", padding: "14px 28px", cursor: "pointer" }}
            >
              View Order
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)", letterSpacing: "0.05em", marginBottom: "40px" }}>
              Transfer the exact amount below, then send us a screenshot on WhatsApp to confirm your order.
            </p>

            <div style={{ border: "1px solid rgba(240,237,230,0.1)", padding: "24px", marginBottom: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", paddingBottom: "18px", borderBottom: "1px solid rgba(240,237,230,0.08)" }}>
                <div>
                  <p style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)", marginBottom: "6px" }}>InstaPay Number</p>
                  <p style={{ fontSize: "16px", color: "#f0ede6", letterSpacing: "0.05em" }}>01553594689</p>
                </div>
                <button
                  onClick={() => copyToClipboard("01553594689", "phone")}
                  style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", padding: "8px 14px", background: copiedField === "phone" ? "rgba(100,200,150,0.15)" : "transparent", color: copiedField === "phone" ? "rgba(100,200,150,0.9)" : "rgba(240,237,230,0.6)", border: `1px solid ${copiedField === "phone" ? "rgba(100,200,150,0.3)" : "rgba(240,237,230,0.2)"}`, cursor: "pointer", fontFamily: "Space Mono, monospace", whiteSpace: "nowrap" }}
                >
                  {copiedField === "phone" ? "✓ Copied" : "Copy"}
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", paddingBottom: "18px", borderBottom: "1px solid rgba(240,237,230,0.08)" }}>
                <div>
                  <p style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)", marginBottom: "6px" }}>Account Name</p>
                  <p style={{ fontSize: "14px", color: "#f0ede6" }}>MOHAMED ABDELHAMID</p>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)", marginBottom: "6px" }}>Amount to Transfer</p>
                  <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", color: "#f0ede6" }}>{amount} <span style={{ fontSize: "12px", fontFamily: "Space Mono, monospace", color: "rgba(240,237,230,0.4)" }}>EGP</span></p>
                </div>
                <button
                  onClick={() => copyToClipboard(String(amount), "amount")}
                  style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", padding: "8px 14px", background: copiedField === "amount" ? "rgba(100,200,150,0.15)" : "transparent", color: copiedField === "amount" ? "rgba(100,200,150,0.9)" : "rgba(240,237,230,0.6)", border: `1px solid ${copiedField === "amount" ? "rgba(100,200,150,0.3)" : "rgba(240,237,230,0.2)"}`, cursor: "pointer", fontFamily: "Space Mono, monospace", whiteSpace: "nowrap" }}
                >
                  {copiedField === "amount" ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "32px" }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "12px" }}>How to pay</p>
              <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.5)", lineHeight: 2, letterSpacing: "0.03em" }}>
                1. Open your bank app or mobile wallet<br />
                2. Choose InstaPay transfer<br />
                3. Paste the number and exact amount above<br />
                4. Take a screenshot of the successful transfer<br />
                5. Send it to us on WhatsApp using the button below
              </p>
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsappClick}
              style={{
                width: "100%", boxSizing: "border-box", padding: "16px", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase",
                fontFamily: "Space Mono, monospace", background: "#25D366", color: "#080808", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#080808"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.553 4.113 1.523 5.84L0 24l6.313-1.494A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.973 0-3.816-.567-5.375-1.546l-.386-.24-3.75.887.906-3.653-.253-.394A9.972 9.972 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Send Payment Proof on WhatsApp
            </a>

            {proofSent && (
              <p style={{ fontSize: "9px", color: "rgba(100,200,150,0.8)", marginTop: "16px", textAlign: "center", letterSpacing: "0.05em", lineHeight: 1.8 }}>
                We&apos;ve opened WhatsApp for you. Once we review your screenshot, we&apos;ll confirm your order and you&apos;ll get an email.
              </p>
            )}

            {/* ─── InstaPay reference number form ─────────────────────────────── */}
            <div style={{ marginTop: "28px", paddingTop: "28px", borderTop: "1px solid rgba(240,237,230,0.1)" }}>
              {refSubmitted ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", background: "rgba(100,200,150,0.08)", border: "1px solid rgba(100,200,150,0.25)", borderRadius: "4px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(100,200,150,0.9)" strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                  <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.7)", letterSpacing: "0.03em", lineHeight: 1.6, margin: 0 }}>
                    Reference number submitted{order?.instapayRef ? ` (${order.instapayRef})` : ""}. We&apos;ll confirm your order shortly.
                  </p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "12px" }}>
                    Then, enter your reference number here
                  </p>
                  <p style={{ fontSize: "9.5px", color: "rgba(240,237,230,0.45)", lineHeight: 1.7, marginBottom: "14px" }}>
                    After the transfer, your bank app shows a reference/transaction number. Enter it below so we can match your payment — this is required to confirm your order, in addition to the WhatsApp screenshot.
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={refInput}
                      onChange={(e) => { setRefInput(e.target.value); setRefError("") }}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmitRef()}
                      placeholder="e.g. 123456789012"
                      style={{ flex: 1, padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1.5px solid rgba(240,237,230,0.18)", color: "#f0ede6", fontFamily: "Space Mono, monospace", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
                    />
                    <button
                      onClick={handleSubmitRef}
                      disabled={refSubmitting}
                      style={{ padding: "0 20px", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", background: refSubmitting ? "rgba(240,237,230,0.15)" : "#f0ede6", color: "#080808", border: "none", cursor: refSubmitting ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
                    >
                      {refSubmitting ? "..." : "Submit"}
                    </button>
                  </div>
                  {refError && <p style={{ fontSize: "9px", color: "#ff6b6b", marginTop: "10px", letterSpacing: "0.05em" }}>{refError}</p>}
                </>
              )}
            </div>

            <p style={{ fontSize: "8px", color: "rgba(240,237,230,0.3)", marginTop: "16px", textAlign: "center", letterSpacing: "0.05em" }}>
              Your order is saved — you can come back to this page anytime to send your payment proof.
            </p>
          </>
        )}

      </div>
    </div>
  )
}