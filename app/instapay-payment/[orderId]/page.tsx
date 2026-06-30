"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"

export default function InstapayPaymentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = params.orderId as string
  const verifyToken = searchParams.get("token") || ""

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refInput, setRefInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}?token=${verifyToken}`)
        if (!res.ok) { setError("Order not found"); return }
        const data = await res.json()
        setOrder(data)
        if (data.status !== "PENDING_PAYMENT") setSubmitted(true)
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
    if (submitting) return
    const ref = refInput.trim()
    if (ref.length < 6) {
      setSubmitError("Please enter a valid transaction reference number")
      return
    }

    setSubmitting(true)
    setSubmitError("")

    try {
      const res = await fetch(`/api/orders/${orderId}/submit-instapay-ref`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instapayRef: ref, verifyToken }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error); return }
      setSubmitted(true)
    } catch {
      setSubmitError("Something went wrong")
    } finally {
      setSubmitting(false)
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

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "80px 24px 60px" }}>

        <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "6px" }}>{invoiceNum}</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "#f0ede6", marginBottom: "8px" }}>
          {submitted ? "Reference Received" : "Complete Your Payment"}
        </h1>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: "11px", color: "rgba(240,237,230,0.6)", lineHeight: 1.8, marginBottom: "32px" }}>
              Thanks! We received your transfer reference for order {invoiceNum}. We'll confirm your payment shortly and you'll get an email once it's verified.
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
              Transfer the exact amount below, then enter your reference number to confirm.
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
                  <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", color: "#f0ede6" }}>{Number(order.totalAmount)} <span style={{ fontSize: "12px", fontFamily: "Space Mono, monospace", color: "rgba(240,237,230,0.4)" }}>EGP</span></p>
                </div>
                <button
                  onClick={() => copyToClipboard(String(Number(order.totalAmount)), "amount")}
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
                4. After transferring, copy your reference number and paste it below
              </p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.6)", marginBottom: "8px", display: "block" }}>
                Transaction Reference Number *
              </label>
              <input
                type="text"
                value={refInput}
                onChange={(e) => setRefInput(e.target.value)}
                placeholder="e.g. TXN123456789"
                style={{ width: "100%", padding: "14px", background: "transparent", border: "1px solid rgba(240,237,230,0.15)", color: "#f0ede6", fontFamily: "Space Mono, monospace", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {submitError && <p style={{ fontSize: "10px", color: "#ff6b6b", marginBottom: "16px", letterSpacing: "0.05em" }}>{submitError}</p>}

            <button
              onClick={handleSubmitRef}
              disabled={submitting}
              style={{ width: "100%", padding: "14px", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", background: "#f0ede6", color: "#080808", border: "none", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Submitting..." : "Confirm Transfer"}
            </button>

            <p style={{ fontSize: "8px", color: "rgba(240,237,230,0.3)", marginTop: "16px", textAlign: "center", letterSpacing: "0.05em" }}>
              Your order is saved — you can come back to this page anytime to submit your reference.
            </p>
          </>
        )}

      </div>
    </div>
  )
}