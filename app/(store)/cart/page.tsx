"use client"

import Link from "next/link"
import { useCart } from "@/lib/store/cart"
import { useMemo, useState } from "react"

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=60"
const ACCENT = "#c8f04f"

export default function CartPage() {
  const { items, gifts, removeItem, updateQuantity, total } = useCart()
  const [stockError, setStockError] = useState("")
  const [checkingStock, setCheckingStock] = useState(false)

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])
  const totalAmount = useMemo(() => total(), [items])
  const validGifts = useMemo(() => gifts.filter((g) => g && g.variantId), [gifts])

  const handleQuantityChange = (variantId: string, current: number, delta: number) => {
    const next = current + delta
    if (next <= 0) {
      removeItem(variantId)
    } else {
      updateQuantity(variantId, Math.min(next, 99))
    }
  }

  const handleCheckout = async () => {
    setStockError("")
    setCheckingStock(true)

    try {
      const res = await fetch("/api/products/validate-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setStockError(data.error || "Some items are unavailable. Please review your cart.")
        return
      }

      window.location.href = "/checkout"
    } catch {
      window.location.href = "/checkout"
    } finally {
      setCheckingStock(false)
    }
  }

  if (items.length === 0) return (
    <div style={{ background: "var(--bg)", color: "var(--fg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace" }}>
      <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "24px" }}>Your cart is empty</p>
      <Link href="/products" style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg)", border: "1px solid var(--fg)", padding: "12px 24px", textDecoration: "none" }}>
        Shop Now
      </Link>
    </div>
  )

  return (
    <div style={{ background: "var(--bg)", color: "var(--fg)", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "70px 20px 60px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "6px" }}>Your</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "var(--fg)", marginBottom: "24px" }}>Cart</h1>

        {validGifts.length > 0 && (
          <div style={{ border: "1px solid rgba(200,240,79,0.3)", background: "rgba(200,240,79,0.03)", padding: "12px 16px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px" }}>🎁</span>
            <p style={{ fontSize: "9px", color: ACCENT, letterSpacing: "0.05em", margin: 0 }}>
              You're getting {validGifts.length} free {validGifts.length === 1 ? "tee" : "tees"} with this order
            </p>
          </div>
        )}

        <div style={{ marginBottom: "32px" }}>
          {items.map((item) => {
            const imgSrc = item.imageUrl || FALLBACK_IMAGE
            return (
              <div key={item.variantId} style={{ display: "flex", gap: "16px", padding: "20px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>

                <div style={{ width: "72px", height: "90px", overflow: "hidden", background: "var(--card)", flexShrink: 0 }}>
                  <img src={imgSrc} alt={item.productName} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "16px", fontWeight: 300, color: "var(--fg)", marginBottom: "4px" }}>{item.productName}</p>
                  <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "12px" }}>
                    {item.color} — {item.size}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <button
                        onClick={() => handleQuantityChange(item.variantId, item.quantity, -1)}
                        aria-label={`Decrease quantity of ${item.productName}`}
                        style={{ width: "28px", height: "28px", border: "1px solid var(--border)", color: "var(--fg-muted)", background: "none", cursor: "pointer", fontFamily: "Space Mono, monospace", fontSize: "14px" }}
                      >−</button>
                      <span style={{ width: "32px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "var(--fg)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.variantId, item.quantity, 1)}
                        aria-label={`Increase quantity of ${item.productName}`}
                        disabled={item.quantity >= 99}
                        style={{ width: "28px", height: "28px", border: "1px solid var(--border)", color: item.quantity >= 99 ? "var(--fg-dim)" : "var(--fg-muted)", background: "none", cursor: item.quantity >= 99 ? "not-allowed" : "pointer", fontFamily: "Space Mono, monospace", fontSize: "14px" }}
                      >+</button>
                    </div>
                    <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "18px", color: "var(--fg)" }}>
                      {item.price * item.quantity} <span style={{ fontSize: "10px", color: "var(--fg-muted)" }}>EGP</span>
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    aria-label={`Remove ${item.productName} from cart`}
                    style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--fg-dim)", background: "none", border: "none", cursor: "pointer", fontFamily: "Space Mono, monospace", padding: "8px 0 0", textDecoration: "underline" }}
                  >
                    Remove
                  </button>
                </div>

              </div>
            )
          })}

          {/* Gift line items — عرض بس، اتختارت في صفحة المنتج */}
          {validGifts.map((gift, idx) => (
            <div key={`gift-${idx}`} style={{ display: "flex", gap: "16px", padding: "16px 0", borderBottom: "1px solid var(--border)", alignItems: "center", opacity: 0.9 }}>
              <div style={{ width: "72px", height: "90px", overflow: "hidden", background: "var(--card)", flexShrink: 0, position: "relative", border: `1px solid ${ACCENT}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                🎁
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "16px", fontWeight: 300, color: "var(--fg)", marginBottom: "4px" }}>{gift.productName}</p>
                <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: ACCENT }}>
                  {gift.color} — {gift.size} — Gift
                </p>
              </div>
              <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "16px", color: ACCENT }}>Free</p>
            </div>
          ))}
        </div>

        <div style={{ border: "1px solid var(--border)", padding: "24px", marginBottom: "16px" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "20px" }}>Order Summary</p>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "10px", color: "var(--fg-muted)" }}>Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
            <span style={{ fontSize: "10px", color: "var(--fg)" }}>{totalAmount} EGP</span>
          </div>

          {validGifts.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "10px", color: ACCENT }}>
                Free Gift ({validGifts.length}x)
              </span>
              <span style={{ fontSize: "10px", color: ACCENT }}>Included</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <span style={{ fontSize: "10px", color: "var(--fg-muted)" }}>Shipping</span>
            <span style={{ fontSize: "10px", color: "var(--fg-muted)" }}>At checkout</span>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
            <span style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-muted)" }}>Total</span>
            <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", color: "var(--fg)" }}>{totalAmount} <span style={{ fontSize: "11px", color: "var(--fg-muted)" }}>EGP</span></span>
          </div>

          {stockError && (
            <p style={{ fontSize: "9px", color: "#ff6b6b", letterSpacing: "0.1em", marginBottom: "12px" }}>{stockError}</p>
          )}

          <button
            onClick={handleCheckout}
            disabled={checkingStock}
            style={{
              display: "block", width: "100%", padding: "14px",
              fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase",
              fontFamily: "Space Mono, monospace", background: "var(--fg)",
              color: "var(--bg)", textAlign: "center", textDecoration: "none",
              border: "none", cursor: checkingStock ? "not-allowed" : "pointer",
              opacity: checkingStock ? 0.7 : 1,
            }}
          >
            {checkingStock ? "Checking..." : "Checkout"}
          </button>
        </div>

        <Link href="/products" style={{ display: "block", textAlign: "center", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "white", textDecoration: "none" }}>
          Continue Shopping
        </Link>

      </div>
    </div>
  )
}