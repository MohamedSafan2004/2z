"use client"

import { useState, useMemo } from "react"
import { useCart } from "@/lib/store/cart"
import { useAuth } from "@/lib/store/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { SHIPPING_RATES, SHIPPING_LABELS, type ShippingZone } from "@/lib/shipping"
import { saveGuestOrderToken } from "@/lib/store/orderTracking"

type PaymentMethod = "cod" | "instapay"

const paymentMethods = [
  { id: "cod",      label: "Cash on delivery", sub: "Pay when you receive" },
  { id: "instapay", label: "InstaPay",          sub: "Transfer and confirm instantly" },
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
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false)

  const [promoInput, setPromoInput]       = useState("")
  const [promoApplied, setPromoApplied]   = useState("")
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoLoading, setPromoLoading]   = useState(false)
  const [promoError, setPromoError]       = useState("")
  const [promoSuccess, setPromoSuccess]   = useState("")

  // Sync form fields from logged-in user (derived state during render, no effect)
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null)
  if (user && user.id !== syncedUserId) {
    setSyncedUserId(user.id)
    if (user.name)  setName(user.name)
    if (user.email) setEmail(user.email)
    if (user.phone) setPhone(user.phone)
  }

  // Reset promo when phone changes (derived state during render, no effect)
  const [lastPromoPhone, setLastPromoPhone] = useState(phone)
  if (phone !== lastPromoPhone) {
    setLastPromoPhone(phone)
    if (promoApplied) {
      setPromoApplied("")
      setPromoDiscount(0)
      setPromoSuccess("")
      setPromoError("Phone changed — please re-apply your promo code")
    }
  }

  // الهدايا خلاص اتختارت في صفحة المنتج — هنا بس عرض
  const validGifts = useMemo(() => gifts.filter((g) => g && g.variantId), [gifts])

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
    padding: "13px 14px",
    background: "transparent",
    border: "1px solid rgba(240,237,230,0.18)",
    color: "#f0ede6",
    fontFamily: "Space Mono, monospace",
    fontSize: "12px",
    outline: "none",
    boxSizing: "border-box",
  }

  const labelStyle: React.CSSProperties = {
    fontSize: "9px",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(240,237,230,0.55)",
    marginBottom: "8px",
    display: "block",
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  // ---- Order summary content (shared between desktop panel and mobile drawer) ----
  const orderSummaryBody = (
    <>
      {items.map((item) => (
        <div key={item.variantId} style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "14px", fontFamily: "Cormorant Garamond, serif", color: "#f0ede6" }}>{item.productName}</p>
            <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.45)", marginTop: "3px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {item.color} / {item.size} × {item.quantity}
            </p>
          </div>
          <p style={{ fontSize: "11px", color: "rgba(240,237,230,0.8)", whiteSpace: "nowrap" }}>{item.price * item.quantity} EGP</p>
        </div>
      ))}

      {/* Gift line items — عرض بس، اتختارت في صفحة المنتج */}
      {validGifts.map((g, idx) => (
        <div key={`gift-${idx}`} style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "14px", fontFamily: "Cormorant Garamond, serif", color: "#f0ede6" }}>{g.productName}</p>
            <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.6)", marginTop: "3px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {g.color} / {g.size} — Gift
            </p>
          </div>
          <p style={{ fontSize: "11px", color: "rgba(240,237,230,0.8)", whiteSpace: "nowrap" }}>Free</p>
        </div>
      ))}

      {/* Promo Code */}
      <div style={{ borderTop: "1px solid rgba(240,237,230,0.1)", paddingTop: "18px", marginTop: "8px", marginBottom: "18px" }}>
        <label style={labelStyle}>Promo code</label>

        {!promoApplied ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={promoInput}
              onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError("") }}
              onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
              placeholder="...."
              style={{
                flex: 1, padding: "12px 14px", background: "transparent",
                border: "1px solid rgba(240,237,230,0.18)", color: "#f0ede6",
                fontFamily: "Space Mono, monospace", fontSize: "11px",
                outline: "none", letterSpacing: "0.1em",
              }}
            />
            <button
              onClick={handleApplyPromo}
              disabled={promoLoading}
              style={{
                padding: "0 18px", fontSize: "9px", letterSpacing: "0.14em",
                textTransform: "uppercase", fontFamily: "Space Mono, monospace",
                background: "transparent", color: promoLoading ? "rgba(240,237,230,0.3)" : "rgba(240,237,230,0.75)",
                border: "1px solid rgba(240,237,230,0.25)", cursor: promoLoading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap", transition: "all 0.2s",
              }}
            >
              {promoLoading ? "..." : "Apply"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: "1px solid rgba(240,237,230,0.3)", background: "rgba(240,237,230,0.05)" }}>
            <div>
              <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.9)", letterSpacing: "0.15em", fontFamily: "Space Mono, monospace" }}>{promoApplied}</p>
              <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.5)", marginTop: "2px", letterSpacing: "0.05em" }}>{promoDiscount}% off</p>
            </div>
            <button onClick={handleRemovePromo} style={{ fontSize: "9px", color: "rgba(240,237,230,0.4)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Space Mono, monospace", letterSpacing: "0.1em" }}>
              Remove
            </button>
          </div>
        )}

        {promoError   && <p style={{ fontSize: "9px", color: "#ff6b6b", marginTop: "8px", letterSpacing: "0.05em" }}>{promoError}</p>}
        {promoSuccess && !promoError && <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.7)", marginTop: "8px", letterSpacing: "0.05em" }}>{promoSuccess}</p>}
      </div>

      {/* Totals */}
      <div style={{ borderTop: "1px solid rgba(240,237,230,0.1)", paddingTop: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px" }}>
          <span style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.45)" }}>Subtotal</span>
          <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.7)" }}>{subtotal} EGP</span>
        </div>

        {validGifts.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px" }}>
            <span style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.6)" }}>Free gift ({validGifts.length}x)</span>
            <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.7)" }}>Worth {giftDisplayValue} EGP</span>
          </div>
        )}

        {promoApplied && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px" }}>
            <span style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.6)" }}>Discount ({promoDiscount}%)</span>
            <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.8)" }}>− {discountValue} EGP</span>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px" }}>
          <span style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.45)" }}>Shipping {zone && `(${SHIPPING_LABELS[zone]})`}</span>
          <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.7)" }}>{zone ? `${shippingCost} EGP` : "—"}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(240,237,230,0.1)" }}>
          <span style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.45)" }}>Total</span>
          <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "30px", color: "#f0ede6" }}>
            {finalTotal} <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.45)" }}>EGP</span>
          </span>
        </div>
      </div>
    </>
  )

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <style>{`
        * { box-sizing: border-box; }
        .checkout-root { overflow-x: hidden; }
        .checkout-grid { display: grid; grid-template-columns: 1fr; gap: 32px; align-items: start; }
        @media (min-width: 860px) {
          .checkout-grid { grid-template-columns: 1fr 380px !important; gap: 64px !important; }
          .checkout-mobile-only { display: none !important; }
          .checkout-desktop-cta { display: block !important; }
        }
        @media (max-width: 859px) {
          .checkout-desktop-summary { display: none !important; }
          .checkout-desktop-cta { display: none !important; }
        }
        .checkout-section { padding: 0 0 32px; margin-bottom: 32px; border-bottom: 1px solid rgba(240,237,230,0.08); }
        .checkout-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .checkout-input::placeholder { color: rgba(240,237,230,0.28); }
        .checkout-input:focus { border-color: rgba(240,237,230,0.55) !important; }
        .checkout-zone-row:last-child, .checkout-pay-row:last-child { border-bottom: none !important; }
        .checkout-mobile-panel { max-height: 0; overflow: hidden; transition: max-height 0.25s ease; border: 1px solid rgba(240,237,230,0.15); border-top: none; margin: -16px 0 28px; }
        .checkout-mobile-panel.open { max-height: 800px; padding: 20px; border-top: 1px solid rgba(240,237,230,0.15); }
      `}</style>

      <div className="checkout-root" style={{ maxWidth: "1020px", margin: "0 auto", padding: "48px 24px 100px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)", marginBottom: "8px" }}>Almost there</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "38px", fontWeight: 300, color: "#f0ede6", marginBottom: "20px", letterSpacing: "-0.01em" }}>Checkout</h1>

        {/* Step indicator — display only, not tied to any routing/state */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "44px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "9px", letterSpacing: "0.1em", color: "rgba(240,237,230,0.5)" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(240,237,230,0.5)" }} />Cart
          </span>
          <span style={{ flex: 1, maxWidth: "40px", height: "1px", background: "rgba(240,237,230,0.1)" }} />
          <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "9px", letterSpacing: "0.1em", color: "rgba(240,237,230,0.85)" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#f0ede6" }} />Details
          </span>
          <span style={{ flex: 1, maxWidth: "40px", height: "1px", background: "rgba(240,237,230,0.1)" }} />
          <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "9px", letterSpacing: "0.1em", color: "rgba(240,237,230,0.3)" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(240,237,230,0.25)" }} />Confirm
          </span>
        </div>

        {/* Mobile collapsible order summary */}
        <div
          className="checkout-mobile-only"
          onClick={() => setMobileSummaryOpen((v) => !v)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(240,237,230,0.18)", padding: "15px 16px", marginBottom: "28px", cursor: "pointer" }}
        >
          <span style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)" }}>
            {itemCount} item{itemCount !== 1 ? "s" : ""} — order summary
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "19px" }}>{finalTotal} EGP</span>
            <span style={{ fontSize: "9px", color: "rgba(240,237,230,0.4)", display: "inline-block", transition: "transform 0.2s", transform: mobileSummaryOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
          </span>
        </div>
        <div className={`checkout-mobile-only checkout-mobile-panel${mobileSummaryOpen ? " open" : ""}`}>
          {orderSummaryBody}
        </div>

        <div className="checkout-grid">

          <div>
            {/* Section 1 — Contact */}
            <div className="checkout-section">
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "22px" }}>
                <span style={{ fontSize: "10px", color: "rgba(240,237,230,0.3)", letterSpacing: "0.05em" }}>01</span>
                <span style={{ fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(240,237,230,0.85)" }}>Contact</span>
              </div>

              <div style={{ marginBottom: 0 }}>
                <label style={labelStyle}>Email *</label>
                <input className="checkout-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="your@email.com" />
                <p style={{ fontSize: "8.5px", color: "rgba(240,237,230,0.4)", marginTop: "7px", letterSpacing: "0.04em", lineHeight: 1.6 }}>
                  Order updates will be sent to this email — no account needed
                </p>
              </div>
            </div>

            {/* Section 2 — Delivery */}
            <div className="checkout-section">
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "22px" }}>
                <span style={{ fontSize: "10px", color: "rgba(240,237,230,0.3)", letterSpacing: "0.05em" }}>02</span>
                <span style={{ fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(240,237,230,0.85)" }}>Delivery</span>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={labelStyle}>Full name *</label>
                <input className="checkout-input" type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={labelStyle}>Phone *</label>
                <input className="checkout-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="01XXXXXXXXX" />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={labelStyle}>Delivery address *</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="Street, Area, City, Governorate"
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>

              <div>
                <label style={labelStyle}>Delivery zone *</label>
                <div style={{ border: "1px solid rgba(240,237,230,0.18)" }}>
                  {zones.map((z) => {
                    const isSelected = zone === z
                    return (
                      <button
                        key={z}
                        className="checkout-zone-row"
                        onClick={() => setZone(z)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
                          padding: "15px 16px", background: isSelected ? "rgba(240,237,230,0.05)" : "transparent",
                          border: "none", borderBottom: "1px solid rgba(240,237,230,0.1)",
                          color: "#f0ede6", cursor: "pointer", fontFamily: "Space Mono, monospace", textAlign: "left",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ width: "14px", height: "14px", borderRadius: "50%", border: isSelected ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {isSelected && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f0ede6" }} />}
                          </span>
                          <span style={{ fontSize: "11px", letterSpacing: "0.05em" }}>{SHIPPING_LABELS[z]}</span>
                        </span>
                        <span style={{ fontSize: "10.5px", color: isSelected ? "rgba(240,237,230,0.85)" : "rgba(240,237,230,0.5)", flexShrink: 0 }}>{SHIPPING_RATES[z]} EGP</span>
                      </button>
                    )
                  })}
                </div>
                <p style={{ fontSize: "8.5px", color: "rgba(240,237,230,0.4)", marginTop: "7px", letterSpacing: "0.04em", lineHeight: 1.6 }}>
                  We currently deliver to Cairo and Giza only
                </p>
              </div>
            </div>

            {/* Section 3 — Payment */}
            <div className="checkout-section">
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "22px" }}>
                <span style={{ fontSize: "10px", color: "rgba(240,237,230,0.3)", letterSpacing: "0.05em" }}>03</span>
                <span style={{ fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(240,237,230,0.85)" }}>Payment method</span>
              </div>

              <div style={{ border: "1px solid rgba(240,237,230,0.18)" }}>
                {paymentMethods.map((m) => {
                  const isSelected = payment === m.id
                  return (
                    <button
                      key={m.id}
                      className="checkout-pay-row"
                      onClick={() => setPayment(m.id as PaymentMethod)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: "14px",
                        padding: "16px", background: isSelected ? "rgba(240,237,230,0.05)" : "transparent",
                        border: "none", borderBottom: "1px solid rgba(240,237,230,0.1)",
                        color: "#f0ede6", cursor: "pointer", fontFamily: "Space Mono, monospace", textAlign: "left",
                      }}
                    >
                      <span style={{ width: "15px", height: "15px", borderRadius: "50%", border: isSelected ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isSelected && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f0ede6" }} />}
                      </span>
                      <span style={{ flex: 1 }}>
                        <p style={{ fontSize: "11.5px", color: "#f0ede6", fontFamily: "Space Mono, monospace", margin: 0, letterSpacing: "0.03em" }}>{m.label}</p>
                        <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.45)", fontFamily: "Space Mono, monospace", margin: "3px 0 0", letterSpacing: "0.03em" }}>{m.sub}</p>
                      </span>
                    </button>
                  )
                })}
              </div>

              {payment === "instapay" && (
                <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.5)", letterSpacing: "0.03em", lineHeight: 1.75, marginTop: "16px", padding: "15px 16px", borderLeft: "1px solid rgba(240,237,230,0.25)" }}>
                  After placing your order, you&apos;ll be taken to a payment page with our InstaPay number and the exact amount. You&apos;ll transfer and enter your transaction reference there.
                </p>
              )}

              {error && <p style={{ fontSize: "10px", color: "#ff6b6b", marginTop: "16px", letterSpacing: "0.1em" }}>{error}</p>}
            </div>
          </div>

          {/* Desktop Order Summary */}
          <div className="checkout-desktop-summary" style={{ border: "1px solid rgba(240,237,230,0.15)", padding: "26px", position: "sticky", top: "80px" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(240,237,230,0.5)", marginBottom: "20px" }}>Order summary</p>

            {orderSummaryBody}

            <button
              className="checkout-desktop-cta"
              onClick={handleOrder}
              disabled={loading}
              style={{ width: "100%", padding: "16px", fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", background: "#f0ede6", color: "#080808", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.3s", marginTop: "22px", marginBottom: "18px" }}
            >
              {loading ? "Please wait..." : payment === "cod" ? "Place Order" : "Continue to Payment"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {["Secure", "Egypt Only", "Easy Returns"].map((t) => (
                <p key={t} style={{ fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)" }}>{t}</p>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div
        className="checkout-mobile-only"
        style={{ position: "sticky", bottom: 0, left: 0, right: 0, background: "#080808", borderTop: "1px solid rgba(240,237,230,0.15)", padding: "14px 16px calc(14px + env(safe-area-inset-bottom))" }}
      >
        {error && <p style={{ fontSize: "10px", color: "#ff6b6b", marginBottom: "10px", letterSpacing: "0.1em" }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(240,237,230,0.45)" }}>Total</span>
          <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px" }}>{finalTotal} EGP</span>
        </div>
        <button
          onClick={handleOrder}
          disabled={loading}
          style={{ width: "100%", padding: "16px", fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", background: "#f0ede6", color: "#080808", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Please wait..." : payment === "cod" ? "Place Order" : "Continue to Payment"}
        </button>
      </div>
    </div>
  )
}