"use client"

import { useState, useEffect, useMemo } from "react"
import { useCart } from "@/lib/store/cart"
import { useAuth } from "@/lib/store/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { SHIPPING_RATES, SHIPPING_LABELS, type ShippingZone } from "@/lib/shipping"
import { saveGuestOrderToken } from "@/lib/store/orderTracking"

const ACCENT = "#c8f04f"

type PaymentMethod = "cod" | "instapay"

const paymentMethods = [
  { id: "cod",      label: "Cash on Delivery", sub: "Pay when you receive" },
  { id: "instapay", label: "InstaPay",          sub: "Transfer & confirm instantly" },
]

const zones: ShippingZone[] = ["cairo", "giza"]

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CheckoutPage() {
  const { items, gifts, total, clearCart } = useCart()
  const { user, token } = useAuth()
  const router = useRouter()

  const [name, setName]           = useState("")
  const [email, setEmail]         = useState("")
  const [phone, setPhone]         = useState("")
  const [address, setAddress]     = useState("")
  const [zone, setZone]           = useState<ShippingZone | "">("")
  const [payment, setPayment]     = useState<PaymentMethod>("cod")
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")

  const [promoInput, setPromoInput]       = useState("")
  const [promoApplied, setPromoApplied]   = useState("")
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoLoading, setPromoLoading]   = useState(false)
  const [promoError, setPromoError]       = useState("")
  const [promoSuccess, setPromoSuccess]   = useState("")

  useEffect(() => {
    if (user?.name)  setName(user.name)
    if (user?.email) setEmail(user.email)
    if (user?.phone) setPhone(user.phone)
  }, [user])

  useEffect(() => {
    if (promoApplied) {
      setPromoApplied("")
      setPromoDiscount(0)
      setPromoSuccess("")
      setPromoError("Phone changed — please re-apply your promo code")
    }
  }, [phone])

  // الهدايا اتختارت في صفحة المنتج — هنا بنتأكد إنها لسه مستحقة فعلاً
  // قبل ما نعرضها أو نبعتها، عشان لو الكارت اتغير (قطعة اتشالت مثلاً)
  // بعد ما العميل اختار هدية، الهدية القديمة متتحسبش كأنها لسه مستحقة.
  const paidQty = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])
  const expectedFreeQty = paidQty >= 3 ? 2 : paidQty >= 2 ? 1 : 0
  const validGifts = useMemo(() => {
    const filtered = gifts.filter((g) => g && g.variantId)
    // لو عدد الهدايا المحفوظة أكتر من المستحق فعلياً للكمية الحالية، منستخدمش غير المستحق
    return filtered.slice(0, expectedFreeQty)
  }, [gifts, expectedFreeQty])

  const subtotal      = total()
  // قيمة الهدية للعرض بس (كام العميل وفر) — مش بتتطرح من subtotal لأنها أصلاً مش داخلة فيه
  const giftDisplayValue = validGifts.reduce((sum, g) => {
    const referenceItem = items.find((i) => i.color === g.color && i.size === g.size) || items[0]
    return sum + (referenceItem?.price || 0)
  }, 0)
  const discountValue = promoApplied ? Math.round((subtotal * promoDiscount) / 100) : 0
  const shippingCost   = zone ? SHIPPING_RATES[zone] : 0
  const finalTotal      = subtotal - discountValue + shippingCost

  const handleApplyPromo = async () => {
    if (promoLoading) return
    const code = promoInput.trim().toUpperCase()
    if (!code) { setPromoError("Enter a promo code"); return }
    if (!phone.trim()) { setPromoError("Enter your phone number first"); return }

    setPromoLoading(true)
    setPromoError("")
    setPromoSuccess("")

    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ code, phone: phone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPromoError(data.error || "Invalid promo code")
        setPromoApplied("")
        setPromoDiscount(0)
        return
      }
      setPromoApplied(data.code)
      setPromoDiscount(data.discount)
      setPromoSuccess(`${data.discount}% discount applied!`)
    } catch {
      setPromoError("Something went wrong")
    } finally {
      setPromoLoading(false)
    }
  }

  const handleRemovePromo = () => {
    setPromoApplied("")
    setPromoDiscount(0)
    setPromoInput("")
    setPromoSuccess("")
    setPromoError("")
  }

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
    if (!zone) {
      setError("Please select your delivery zone")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
          giftSelections: validGifts.map((g) => ({ variantId: g.variantId })),
          address: trimmedAddress,
          phone: trimmedPhone,
          email: trimmedEmail,
          paymentMethod: payment,
          shippingZone: zone,
          promoCode: promoApplied || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      clearCart()

      if (payment === "instapay") {
        saveGuestOrderToken(data.id, data.verifyToken)
        router.push(`/instapay-payment/${data.id}?token=${data.verifyToken}`)
      } else if (user) {
        router.push("/orders")
      } else {
        router.push(`/order-confirmed?email=${encodeURIComponent(trimmedEmail)}`)
      }
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
      <style>{`@media (min-width: 768px) { .checkout-grid { grid-template-columns: 1fr 360px !important; gap: 64px !important; } }`}</style>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "80px 24px 60px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "6px" }}>Almost there</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "40px", fontWeight: 300, color: "#f0ede6", marginBottom: "48px" }}>Checkout</h1>

        <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px", alignItems: "start" }}>

          <div>
            <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "16px" }}>Contact</p>

            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="your@email.com" />
              <p style={{ fontSize: "8px", color: "rgb(255,255,255)", marginTop: "6px", letterSpacing: "0.1em" }}>
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

            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Delivery Zone *</label>
              <div style={{ position: "relative" }}>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value as ShippingZone)}
                  style={{
                    width: "100%", padding: "12px 36px 12px 12px", background: "transparent",
                    border: zone ? "1px solid rgba(240,237,230,0.4)" : "1px solid rgba(240,237,230,0.15)",
                    color: zone ? "#f0ede6" : "rgba(240,237,230,0.4)",
                    fontFamily: "Space Mono, monospace", fontSize: "11px", outline: "none",
                    boxSizing: "border-box", appearance: "none", cursor: "pointer", letterSpacing: "0.05em",
                    transition: "border 0.15s",
                  }}
                >
                  <option value="" disabled style={{ background: "#080808", color: "rgba(240,237,230,0.4)" }}>Select your area</option>
                  {zones.map((z) => (
                    <option key={z} value={z} style={{ background: "#080808", color: "#f0ede6" }}>
                      {SHIPPING_LABELS[z]} — {SHIPPING_RATES[z]} EGP
                    </option>
                  ))}
                </select>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.5)" strokeWidth="2"
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <p style={{ fontSize: "8px", color: "rgba(240,237,230,0.3)", marginTop: "8px", letterSpacing: "0.05em" }}>
                We currently deliver to Cairo and Giza only
              </p>
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
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: isSelected ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "border 0.15s" }}>
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

            {payment === "instapay" && (
              <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.4)", letterSpacing: "0.08em", lineHeight: 1.8, marginTop: "16px", padding: "14px", border: "1px solid rgba(240,237,230,0.08)" }}>
                After placing your order, you'll be taken to a payment page with our InstaPay number and the exact amount. You'll transfer and enter your transaction reference there.
              </p>
            )}

            {error && <p style={{ fontSize: "10px", color: "#ff6b6b", marginTop: "16px", letterSpacing: "0.1em" }}>{error}</p>}
          </div>

          {/* Order Summary */}
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

            {/* Gift line items — عرض بس، اتختارت في صفحة المنتج */}
            {validGifts.map((g, idx) => (
              <div key={`gift-${idx}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", gap: "12px" }}>
                <div>
                  <p style={{ fontSize: "11px", fontFamily: "Cormorant Garamond, serif", color: "#f0ede6" }}>🎁 {g.productName}</p>
                  <p style={{ fontSize: "9px", color: ACCENT, marginTop: "2px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {g.color} / {g.size} — Gift
                  </p>
                </div>
                <p style={{ fontSize: "11px", color: ACCENT, whiteSpace: "nowrap" }}>Free</p>
              </div>
            ))}

            {/* Promo Code */}
            <div style={{ borderTop: "1px solid rgba(240,237,230,0.08)", paddingTop: "16px", marginTop: "8px", marginBottom: "16px" }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "10px" }}>Promo Code</p>

              {!promoApplied ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError("") }}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                    placeholder="...."
                    style={{
                      flex: 1, padding: "10px 12px", background: "transparent",
                      border: "1px solid rgba(240,237,230,0.15)", color: "#f0ede6",
                      fontFamily: "Space Mono, monospace", fontSize: "11px",
                      outline: "none", letterSpacing: "0.1em",
                    }}
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoLoading}
                    style={{
                      padding: "10px 16px", fontSize: "9px", letterSpacing: "0.15em",
                      textTransform: "uppercase", fontFamily: "Space Mono, monospace",
                      background: "transparent", color: promoLoading ? "rgba(240,237,230,0.3)" : "rgba(240,237,230,0.7)",
                      border: "1px solid rgba(240,237,230,0.2)", cursor: promoLoading ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap", transition: "all 0.2s",
                    }}
                  >
                    {promoLoading ? "..." : "Apply"}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", border: "1px solid rgba(80,200,120,0.25)", background: "rgba(80,200,120,0.04)" }}>
                  <div>
                    <p style={{ fontSize: "10px", color: "rgba(80,200,120,0.9)", letterSpacing: "0.15em", fontFamily: "Space Mono, monospace" }}>{promoApplied}</p>
                    <p style={{ fontSize: "9px", color: "rgba(80,200,120,0.6)", marginTop: "2px", letterSpacing: "0.05em" }}>{promoDiscount}% off</p>
                  </div>
                  <button onClick={handleRemovePromo} style={{ fontSize: "9px", color: "rgba(240,237,230,0.3)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Space Mono, monospace", letterSpacing: "0.1em" }}>
                    Remove
                  </button>
                </div>
              )}

              {promoError   && <p style={{ fontSize: "9px", color: "#ff6b6b", marginTop: "8px", letterSpacing: "0.05em" }}>{promoError}</p>}
              {promoSuccess && !promoError && <p style={{ fontSize: "9px", color: "rgba(80,200,120,0.8)", marginTop: "8px", letterSpacing: "0.05em" }}>{promoSuccess}</p>}
            </div>

            {/* Totals */}
            <div style={{ borderTop: "1px solid rgba(240,237,230,0.08)", paddingTop: "16px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)" }}>Subtotal</span>
                <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.5)" }}>{subtotal} EGP</span>
              </div>

              {validGifts.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: ACCENT }}>Free Gift ({validGifts.length}x)</span>
                  <span style={{ fontSize: "11px", color: ACCENT }}>Worth {giftDisplayValue} EGP</span>
                </div>
              )}

              {promoApplied && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(80,200,120,0.7)" }}>Discount ({promoDiscount}%)</span>
                  <span style={{ fontSize: "11px", color: "rgba(80,200,120,0.8)" }}>− {discountValue} EGP</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)" }}>Shipping {zone && `(${SHIPPING_LABELS[zone]})`}</span>
                <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.5)" }}>{zone ? `${shippingCost} EGP` : "—"}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(240,237,230,0.08)" }}>
                <span style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)" }}>Total</span>
                <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", color: "#f0ede6" }}>
                  {finalTotal} <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.4)" }}>EGP</span>
                </span>
              </div>
            </div>

            <button
              onClick={handleOrder}
              disabled={loading}
              style={{ width: "100%", padding: "14px", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", background: "#f0ede6", color: "#080808", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.3s", marginBottom: "16px" }}
            >
              {loading ? "Please wait..." : payment === "cod" ? "Place Order" : "Continue to Payment"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {["Secure", "Egypt Only", "Easy Returns"].map((t) => (
                <p key={t} style={{ fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgb(255,255,255)" }}>{t}</p>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}