"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/store/cart"

const ACCENT = "#c8f04f"

export default function CartPage() {
  const { items, gifts, removeItem, updateQuantity, clearGifts, total } = useCart()
  const router = useRouter()

  // ─── Stale gift cleanup ─────────────────────────────────────────────────
  // نفس الحماية اللي في صفحة المنتج — لو الكمية اتغيرت هنا (زيادة/نقصان/حذف)
  // وبقى عدد الهدايا المحفوظة أكتر من المستحق، امسحهم فورًا.
  const paidQty = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])
  const expectedFreeQty = paidQty >= 3 ? 2 : paidQty >= 2 ? 1 : 0
  const validGifts = useMemo(() => gifts.filter((g) => g && g.variantId).slice(0, expectedFreeQty), [gifts, expectedFreeQty])

  useEffect(() => {
    if (gifts.filter((g) => g && g.variantId).length > expectedFreeQty) {
      clearGifts()
    }
  }, [expectedFreeQty, gifts, clearGifts])

  const subtotal = total()
  const giftDisplayValue = validGifts.reduce((sum, g) => {
    const referenceItem = items.find((i) => i.color === g.color && i.size === g.size) || items[0]
    return sum + (referenceItem?.price || 0)
  }, 0)

  if (items.length === 0) {
    return (
      <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace" }}>
        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "24px" }}>
          Your cart is empty
        </p>
        <Link href="/products" style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#f0ede6", border: "1px solid rgba(240,237,230,0.3)", padding: "12px 24px", textDecoration: "none" }}>
          Shop Now
        </Link>
      </div>
    )
  }

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <style>{`
        @media (min-width: 768px) { .cart-grid { grid-template-columns: 1fr 340px !important; gap: 64px !important; } }
        .qty-btn {
          width: 28px; height: 28px; background: transparent;
          border: 1px solid rgba(240,237,230,0.15); color: #f0ede6;
          cursor: pointer; font-size: 13px; font-family: 'Space Mono', monospace;
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.15s;
        }
        .qty-btn:hover { border-color: rgba(240,237,230,0.4); }
        .remove-btn {
          font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(240,237,230,0.35); background: transparent; border: none;
          cursor: pointer; font-family: 'Space Mono', monospace; padding: 0;
          transition: color 0.15s;
        }
        .remove-btn:hover { color: #ff6b6b; }
      `}</style>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "80px 24px 60px" }}>

        <Link href="/products" style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", textDecoration: "none", marginBottom: "20px", display: "inline-block" }}>
          ← Continue Shopping
        </Link>

        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "40px", fontWeight: 300, color: "#f0ede6", marginBottom: "48px", marginTop: "16px" }}>
          Your Cart
        </h1>

        <div className="cart-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px", alignItems: "start" }}>

          {/* ── Items list ── */}
          <div>
            {items.map((item) => (
              <div
                key={item.variantId}
                style={{
                  display: "flex", gap: "16px", padding: "20px 0",
                  borderBottom: "1px solid rgba(240,237,230,0.08)",
                }}
              >
                <div style={{ width: "80px", height: "100px", flexShrink: 0, background: "#111", overflow: "hidden" }}>
                  {(item.imageUrl || item.image) && (
                    <img
                      src={item.imageUrl || item.image}
                      alt={item.productName}
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                    />
                  )}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
                  <div>
                    <p style={{ fontSize: "15px", fontFamily: "Cormorant Garamond, serif", color: "#f0ede6", margin: "0 0 4px" }}>
                      {item.productName}
                    </p>
                    <p style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", margin: 0 }}>
                      {item.color} / {item.size}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button className="qty-btn" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>−</button>
                      <span style={{ fontSize: "12px", minWidth: "16px", textAlign: "center" }}>{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>+</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{ fontSize: "12px", color: "#f0ede6", whiteSpace: "nowrap" }}>{item.price * item.quantity} EGP</span>
                      <button className="remove-btn" onClick={() => removeItem(item.variantId)}>Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {validGifts.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: ACCENT, margin: "20px 0 12px" }}>
                  🎁 Free Gifts
                </p>
                {validGifts.map((g, idx) => (
                  <div
                    key={`gift-${idx}`}
                    style={{
                      display: "flex", gap: "16px", padding: "14px 0",
                      borderBottom: "1px solid rgba(240,237,230,0.08)",
                      opacity: 0.9,
                    }}
                  >
                    <div style={{ width: "80px", height: "100px", flexShrink: 0, background: "#111", overflow: "hidden" }}>
                      {(g.imageUrl || g.image) && (
                        <img
                          src={g.imageUrl || g.image}
                          alt={g.productName}
                          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                      <p style={{ fontSize: "14px", fontFamily: "Cormorant Garamond, serif", color: "#f0ede6", margin: "0 0 4px" }}>
                        {g.productName}
                      </p>
                      <p style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: ACCENT, margin: 0 }}>
                        {g.color} / {g.size} — Free
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Summary ── */}
          <div style={{ border: "1px solid rgba(240,237,230,0.08)", padding: "28px", position: "sticky", top: "80px" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "20px" }}>
              Summary
            </p>

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

            <p style={{ fontSize: "8px", color: "rgba(240,237,230,0.3)", marginTop: "12px", marginBottom: "20px", lineHeight: 1.7 }}>
              Shipping is calculated at checkout.
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: "16px", borderTop: "1px solid rgba(240,237,230,0.08)", marginBottom: "24px" }}>
              <span style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)" }}>Total</span>
              <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", color: "#f0ede6" }}>
                {subtotal} <span style={{ fontSize: "11px", color: "rgba(240,237,230,0.4)" }}>EGP</span>
              </span>
            </div>

            <button
              onClick={() => router.push("/checkout")}
              style={{
                width: "100%", padding: "14px", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase",
                fontFamily: "Space Mono, monospace", background: "#f0ede6", color: "#080808",
                border: "none", cursor: "pointer", transition: "opacity 0.2s",
              }}
            >
              Proceed to Checkout
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
