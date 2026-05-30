"use client"

import { useState } from "react"
import { useCart } from "@/lib/store/cart"
import { useAuth } from "@/lib/store/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"

type PaymentMethod = "cod" | "vodafone" | "card"

const paymentMethods = [
  { id: "cod",      label: "Cash on Delivery",   sub: "Pay when you receive", available: true },
  { id: "vodafone", label: "Vodafone Cash",       sub: "Pay online instantly", available: true },
  { id: "card",     label: "Credit / Debit Card", sub: "Visa & Mastercard",    available: true },
]

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { user, token } = useAuth()
  const router = useRouter()

  const [name, setName]       = useState(user?.name || "")
  const [email, setEmail]     = useState(user?.email || "")
  const [phone, setPhone]     = useState(user?.phone || "")
  const [address, setAddress] = useState("")
  const [payment, setPayment] = useState<PaymentMethod>("cod")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  if (items.length === 0) return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace" }}>
      <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "24px" }}>Your cart is empty</p>
      <Link href="/products" style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#f0ede6", border: "1px solid rgba(240,237,230,0.3)", padding: "12px 24px" }}>Shop Now</Link>
    </div>
  )

  const handleOrder = async () => {
    if (loading) return

    const trimmedName    = name.trim()
    const trimmedEmail   = email.trim()
    const trimmedPhone   = phone.trim()
    const trimmedAddress = address.trim()

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedAddress) {
      setError("Please fill in all required fields")
      return
    }
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address")
      return
    }
    if (!/^01[0-9]{9}$/.test(trimmedPhone)) {
      setError("Please enter a valid Egyptian phone number (01XXXXXXXXX)")
      return
    }

    setLoading(true)
    setError("")

    try {
      if (payment === "cod") {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
          body: JSON.stringify({
            items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
            address: trimmedAddress, phone: trimmedPhone, email: trimmedEmail, paymentMethod: "cod",
          }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error); return }
        clearCart()
        if (user) { router.push("/orders") } else { router.push(`/order-confirmed?email=${encodeURIComponent(trimmedEmail)}`) }
        return
      }

      const res = await fetch("/api/paymob/intention", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({
          items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
          address: trimmedAddress, phone: trimmedPhone, email: trimmedEmail, paymentMethod: payment,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      if (!data.clientSecret) {
        setError("Payment session failed. Please try again.")
        return
      }

      // لا نعمل clearCart هنا — بنعملها بعد تأكيد الدفع
      sessionStorage.setItem("pending_order_id", data.orderId)
      sessionStorage.setItem("pending_order_email", trimmedEmail)

      window.location.href = `https://accept.paymob.com/unifiedcheckout/?publicKey=${process.env.NEXT_PUBLIC_PAYMOB_PUBLIC_KEY}&clientSecret=${data.clientSecret}`

    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    background: "transparent",
    border: "1px solid rgba(240,237,230,0.15)",
    color: "#f0ede6",
    fontFamily: "Space Mono, monospace",
    fontSize: "11px",
    outline: "none",
    boxSizing: "border-box",
  }

  const labelStyle: React.CSSProperties = {
    fontSize: "9px",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "rgba(240,237,230,0.6)",
    marginBottom: "8px",
    display: "block",
  }

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "80px 24px 60px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "6px" }}>Almost there</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "40px", fontWeight: 300, color: "#f0ede6", marginBottom: "48px" }}>Checkout</h1>

        <style>{`@media (min-width: 768px) { .checkout-grid { grid-template-columns: 1fr 360px !important; gap: 64px !important; } }`}</style>
        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px", alignItems: "start" }}>

          <div>
            <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "16px" }}>Contact</p>

            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="your@email.com" />
              <p style={{ fontSize: "8px", color: "rgba(240,237,230,0.35)", marginTop: "6px", letterSpacing: "0.1em" }}>
                Order updates will be sent to this email — no account needed
              </p>
            </div>

            <div style={{ borderTop: "1px solid rgba(240,237,230,0.08)", margin: "24px 0" }} />

            <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "16px" }}>Delivery</p>

            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Full Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Phone *</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="01XXXXXXXXX" />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Delivery Address *</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Street, Area, City, Governorate" style={{ ...inputStyle, resize: "none" }} />
            </div>

            <div style={{ borderTop: "1px solid rgba(240,237,230,0.08)", margin: "24px 0" }} />

            <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "16px" }}>Payment Method</p>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {paymentMethods.map((m, i) => {
                const isSelected = payment === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setPayment(m.id as PaymentMethod)}
                    style={{
                      display: "flex", alignItems: "center", gap: "16px", padding: "16px",
                      background: isSelected ? "rgba(240,237,230,0.04)" : "transparent",
                      border: "1px solid rgba(240,237,230,0.12)",
                      borderTop: i === 0 ? "1px solid rgba(240,237,230,0.12)" : "none",
                      cursor: "pointer", textAlign: "left", width: "100%", transition: "background 0.15s",
                    }}
                  >
                    <div style={{
                      width: "16px", height: "16px", borderRadius: "50%",
                      border: isSelected ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "border 0.15s",
                    }}>
                      {isSelected && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f0ede6" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "11px", color: "#f0ede6", fontFamily: "Space Mono, monospace", margin: 0 }}>{m.label}</p>
                      <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.4)", fontFamily: "Space Mono, monospace", margin: "3px 0 0", letterSpacing: "0.05em" }}>{m.sub}</p>
                    </div>
                    {isSelected && (
                      <div style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.5)" }}>Selected</div>
                    )}
                  </button>
                )
              })}
            </div>

            {error && <p style={{ fontSize: "10px", color: "#ff6b6b", marginTop: "16px", letterSpacing: "0.1em" }}>{error}</p>}
          </div>

          <div style={{ border: "1px solid rgba(240,237,230,0.08)", padding: "28px", position: "sticky", top: "80px" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "20px" }}>Order Summary</p>

            {items.map((item) => (
              <div key={item.variantId} style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", gap: "12px" }}>
                <div>
                  <p style={{ fontSize: "11px", fontFamily: "Cormorant Garamond, serif", color: "#f0ede6" }}>{item.productName}</p>
                  <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.4)", marginTop: "2px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {item.color} / {item.size} × {item.quantity}
                  </p>
                </div>
                <p style={{ fontSize: "11px", color: "#f0ede6", whiteSpace: "nowrap" }}>{item.price * item.quantity} EGP</p>
              </div>
            ))}

            <div style={{ borderTop: "1px solid rgba(240,237,230,0.08)", paddingTop: "16px", marginTop: "8px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)" }}>Total</span>
                <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", color: "#f0ede6" }}>
                  {total()} <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.4)" }}>EGP</span>
                </span>
              </div>
            </div>

            <button
              onClick={handleOrder}
              disabled={loading}
              style={{
                width: "100%", padding: "14px", fontSize: "10px",
                letterSpacing: "0.25em", textTransform: "uppercase",
                fontFamily: "Space Mono, monospace", background: "#f0ede6",
                color: "#080808", border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1, transition: "all 0.3s", marginBottom: "16px",
              }}
            >
              {loading ? "Please wait..." : payment === "cod" ? "Place Order" : "Pay Now"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {["Secure", "Egypt Only", "Easy Returns"].map((t) => (
                <p key={t} style={{ fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,230,0.25)" }}>{t}</p>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}