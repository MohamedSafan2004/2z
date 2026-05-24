"use client"

import Link from "next/link"
import { useCart } from "@/lib/store/cart"

const productImages: Record<string, string> = {
  "1": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=60",
  "2": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=60",
  "3": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&q=60",
  "4": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&q=60",
  "5": "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=200&q=60",
  "6": "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=200&q=60",
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCart()

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
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "var(--fg)", marginBottom: "32px" }}>Cart</h1>

        {/* Items */}
        <div style={{ marginBottom: "32px" }}>
          {items.map((item) => {
            const productId = item.variantId.split("-")[0]
            const imgSrc = productImages[productId] || productImages["1"]
            return (
              <div key={item.variantId} style={{ display: "flex", gap: "16px", padding: "20px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>

                {/* Image */}
                <div style={{ width: "72px", height: "90px", overflow: "hidden", background: "var(--card)", flexShrink: 0 }}>
                  <img src={imgSrc} alt={item.productName} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "16px", fontWeight: 300, color: "var(--fg)", marginBottom: "4px" }}>{item.productName}</p>
                  <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "12px" }}>
                    {item.color} — {item.size}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} style={{ width: "28px", height: "28px", border: "1px solid var(--border)", color: "var(--fg-muted)", background: "none", cursor: "pointer", fontFamily: "Space Mono, monospace", fontSize: "14px" }}>−</button>
                      <span style={{ width: "32px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "var(--fg)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} style={{ width: "28px", height: "28px", border: "1px solid var(--border)", color: "var(--fg-muted)", background: "none", cursor: "pointer", fontFamily: "Space Mono, monospace", fontSize: "14px" }}>+</button>
                    </div>
                    <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "18px", color: "var(--fg)" }}>
                      {item.price * item.quantity} <span style={{ fontSize: "10px", color: "var(--fg-muted)" }}>EGP</span>
                    </p>
                  </div>
                  <button onClick={() => removeItem(item.variantId)} style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--fg-dim)", background: "none", border: "none", cursor: "pointer", fontFamily: "Space Mono, monospace", padding: "8px 0 0", textDecoration: "underline" }}>
                    Remove
                  </button>
                </div>

              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div style={{ border: "1px solid var(--border)", padding: "24px", marginBottom: "16px" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "20px" }}>Order Summary</p>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "10px", color: "var(--fg-muted)" }}>Subtotal</span>
            <span style={{ fontSize: "10px", color: "var(--fg)" }}>{total()} EGP</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <span style={{ fontSize: "10px", color: "var(--fg-muted)" }}>Shipping</span>
            <span style={{ fontSize: "10px", color: "var(--fg-muted)" }}>At checkout</span>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "24px" }}>
            <span style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-muted)" }}>Total</span>
            <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", color: "var(--fg)" }}>{total()} <span style={{ fontSize: "11px", color: "var(--fg-muted)" }}>EGP</span></span>
          </div>
          <Link href="/checkout" style={{ display: "block", width: "100%", padding: "14px", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", background: "var(--fg)", color: "var(--bg)", textAlign: "center", textDecoration: "none" }}>
            Checkout
          </Link>
        </div>

        <Link href="/products" style={{ display: "block", textAlign: "center", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-dim)", textDecoration: "none" }}>
          Continue Shopping
        </Link>

      </div>
    </div>
  )
}