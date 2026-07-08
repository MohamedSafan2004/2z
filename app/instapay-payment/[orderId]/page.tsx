"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"

const WHATSAPP_NUMBER = "201114833377" // 011 1483 3377 بصيغة دولية بدون +

export default function InstapayPaymentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const verifyToken = searchParams.get("token") || ""

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [proofSent, setProofSent] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}?token=${verifyToken}`)
        if (!res.ok) { setError("Order not found"); return }
        const data = await res.json()
        setOrder(data)
        if (data.paymentStatus === "PAID") setProofSent(true)
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
                We've opened WhatsApp for you. Once we review your screenshot, we'll confirm your order and you'll get an email.
              </p>
            )}

            <p style={{ fontSize: "8px", color: "rgba(240,237,230,0.3)", marginTop: "16px", textAlign: "center", letterSpacing: "0.05em" }}>
              Your order is saved — you can come back to this page anytime to send your payment proof.
            </p>
          </>
        )}

      </div>
    </div>
  )
}