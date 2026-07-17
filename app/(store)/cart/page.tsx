"use client"

import Link from "next/link"
import { useCart } from "@/lib/store/cart"
import { useEffect, useMemo, useState } from "react"

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&q=60"
const ACCENT = "#c8f04f"

const SIZES = ["M", "L", "XL"]
const COLORS = ["BLACK", "WHITE", "GREY", "BEIGE"]

interface AvailableVariant {
  variantId: string
  color: string
  size: string
  productName: string
}

// عتبات العروض — لازم تتطابق مع الـ Promotion rows في الداتابيز
const TIERS = [
  { triggerQuantity: 3, freeQuantity: 2 },
  { triggerQuantity: 2, freeQuantity: 1 },
].sort((a, b) => b.triggerQuantity - a.triggerQuantity)

function getEligibleTier(paidQuantity: number) {
  return TIERS.find((t) => paidQuantity >= t.triggerQuantity) ?? null
}

export default function CartPage() {
  const { items, gifts, removeItem, updateQuantity, total, setGift, removeGift } = useCart()
  const [stockError, setStockError] = useState("")
  const [checkingStock, setCheckingStock] = useState(false)
  const [availableVariants, setAvailableVariants] = useState<AvailableVariant[]>([])
  const [loadingVariants, setLoadingVariants] = useState(false)

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])
  const totalAmount = useMemo(() => total(), [items])
  const eligibleTier = useMemo(() => getEligibleTier(itemCount), [itemCount])
  const nextTier = useMemo(
    () => TIERS.slice().sort((a, b) => a.triggerQuantity - b.triggerQuantity).find((t) => t.triggerQuantity > itemCount),
    [itemCount]
  )

  useEffect(() => {
    if (!eligibleTier) return
    setLoadingVariants(true)
    fetch("/api/products/gift-variants")
      .then((res) => res.json())
      .then((data) => setAvailableVariants(data.variants || []))
      .catch(() => setAvailableVariants([]))
      .finally(() => setLoadingVariants(false))
  }, [eligibleTier])

  const handleQuantityChange = (variantId: string, current: number, delta: number) => {
    const next = current + delta
    if (next <= 0) {
      removeItem(variantId)
    } else {
      updateQuantity(variantId, Math.min(next, 99))
    }
  }

  const giftsComplete =
    !!eligibleTier &&
    gifts.length === eligibleTier.freeQuantity &&
    gifts.every((g) => g && g.variantId)

  // لو مستحق العرض بس مختارش هديته بالكامل، منمنعوش من الأوردر —
  // بس نورّيله تنبيه ودود إنه هيفوّت الهدية، وهو اللي يقرر يكمل ولا يرجع يختار
  const partiallySelected =
    !!eligibleTier && !giftsComplete

  const [showSkipWarning, setShowSkipWarning] = useState(false)

  const handleCheckout = async () => {
    if (partiallySelected) {
      setShowSkipWarning(true)
      return
    }
    await proceedToCheckout()
  }

  const proceedToCheckout = async () => {
    setStockError("")
    setShowSkipWarning(false)
    setCheckingStock(true)

    try {
      const res = await fetch("/api/products/validate-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        }),
      })

      // ملحوظة: لو giftsComplete=false، الكارت هيتوجه للـ checkout عادي
      // وهناك (صفحة الـ checkout) هي اللي بتبني giftSelections الفعلية
      // اللي بتتبعت لـ /api/orders — لو الهدية مش مكتملة هتتبعت فاضية تلقائي

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
      <style>{`
        @keyframes giftPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(200,240,79,0.15); } 50% { box-shadow: 0 0 0 6px rgba(200,240,79,0); } }
        @keyframes giftSlide { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

        .gift-box {
          border: 1px solid rgba(200,240,79,0.35);
          background: linear-gradient(180deg, rgba(200,240,79,0.05) 0%, rgba(200,240,79,0.01) 100%);
          animation: giftPulse 2.5s ease infinite;
          animation-delay: 1s;
        }
        .gift-select {
          background: var(--bg);
          border: 1px solid rgba(240,237,230,0.2);
          color: var(--fg);
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 10px 8px;
          width: 100%;
          cursor: pointer;
        }
        .gift-select:focus { outline: none; border-color: ${ACCENT}; }
        .gift-row { animation: giftSlide 0.4s ease both; }
        .progress-track { height: 3px; background: rgba(240,237,230,0.08); width: 100%; overflow: hidden; }
        .progress-fill { height: 100%; background: ${ACCENT}; transition: width 0.4s ease; }
      `}</style>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "70px 20px 60px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "6px" }}>Your</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "var(--fg)", marginBottom: "24px" }}>Cart</h1>

        {/* ── PROGRESS TEASER — لسه ما وصلش لعرض ── */}
        {!eligibleTier && nextTier && (
          <div style={{ border: "1px solid rgba(240,237,230,0.1)", padding: "16px 18px", marginBottom: "28px" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.05em", color: "var(--fg-muted)", marginBottom: "10px" }}>
              🎁 أضف <span style={{ color: ACCENT }}>{nextTier.triggerQuantity - itemCount}</span> كمان واحصل على {nextTier.freeQuantity === 1 ? "قطعة مجانية" : `${nextTier.freeQuantity} قطع مجانية`}
            </p>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min(100, (itemCount / nextTier.triggerQuantity) * 100)}%` }} />
            </div>
          </div>
        )}

        {/* ── GIFT SELECTOR — العميل مستحق العرض ── */}
        {eligibleTier && (
          <div className="gift-box" style={{ padding: "22px 20px", marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ fontSize: "14px" }}>🎉</span>
              <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: ACCENT, margin: 0 }}>
                {eligibleTier.freeQuantity === 1 ? "عندك قطعة مجانية" : `عندك ${eligibleTier.freeQuantity} قطع مجانية`}
              </p>
            </div>
            <p style={{ fontSize: "9px", color: "var(--fg-muted)", marginBottom: "18px", letterSpacing: "0.03em" }}>
              اختار اللون والمقاس بتاع هديتك
            </p>

            {loadingVariants ? (
              <p style={{ fontSize: "9px", color: "var(--fg-dim)" }}>...جاري التحميل</p>
            ) : (
              Array.from({ length: eligibleTier.freeQuantity }).map((_, idx) => {
                const currentGift = gifts[idx]
                const colorOptions = COLORS.filter((c) =>
                  availableVariants.some((v) => v.color === c)
                )
                const sizeOptionsForColor = currentGift?.color
                  ? availableVariants.filter((v) => v.color === currentGift.color).map((v) => v.size)
                  : []

                return (
                  <div key={idx} className="gift-row" style={{ marginBottom: idx < eligibleTier.freeQuantity - 1 ? "14px" : 0 }}>
                    <p style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--fg-dim)", marginBottom: "6px" }}>
                      هدية {eligibleTier.freeQuantity > 1 ? idx + 1 : ""}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <select
                        className="gift-select"
                        value={currentGift?.color || ""}
                        onChange={(e) => {
                          const color = e.target.value
                          const firstAvailable = availableVariants.find((v) => v.color === color)
                          setGift(idx, {
                            variantId: firstAvailable?.variantId || "",
                            productName: firstAvailable?.productName || "Oversize T-Shirt",
                            color,
                            size: firstAvailable?.size || "",
                          })
                        }}
                      >
                        <option value="">اختار اللون</option>
                        {colorOptions.map((c) => (
                          <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                        ))}
                      </select>

                      <select
                        className="gift-select"
                        value={currentGift?.size || ""}
                        disabled={!currentGift?.color}
                        onChange={(e) => {
                          const size = e.target.value
                          const variant = availableVariants.find((v) => v.color === currentGift?.color && v.size === size)
                          if (currentGift) {
                            setGift(idx, { ...currentGift, variantId: variant?.variantId || "", size })
                          }
                        }}
                        style={{ opacity: currentGift?.color ? 1 : 0.4, cursor: currentGift?.color ? "pointer" : "not-allowed" }}
                      >
                        <option value="">المقاس</option>
                        {sizeOptionsForColor.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })
            )}
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

          {/* ── GIFT LINE ITEMS في قائمة الكارت ── */}
          {eligibleTier && gifts.filter((g) => g?.variantId).map((gift, idx) => (
            <div key={`gift-${idx}`} style={{ display: "flex", gap: "16px", padding: "16px 0", borderBottom: "1px solid var(--border)", alignItems: "center", opacity: 0.85 }}>
              <div style={{ width: "72px", height: "90px", overflow: "hidden", background: "var(--card)", flexShrink: 0, position: "relative", border: `1px solid ${ACCENT}` }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🎁</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "16px", fontWeight: 300, color: "var(--fg)", marginBottom: "4px" }}>{gift.productName}</p>
                <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
                  {gift.color} — {gift.size}
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

          {eligibleTier && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "10px", color: ACCENT }}>
                Free Gift ({eligibleTier.freeQuantity}x)
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

      {/* ── SKIP GIFT WARNING MODAL ── */}
      {showSkipWarning && (
        <div
          onClick={() => setShowSkipWarning(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(8,8,8,0.85)", backdropFilter: "blur(6px)",
            zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "360px", width: "100%", background: "var(--bg)",
              border: `1px solid ${ACCENT}`, padding: "28px 24px",
            }}
          >
            <p style={{ fontSize: "22px", marginBottom: "12px" }}>🎁</p>
            <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "20px", fontWeight: 300, color: "var(--fg)", marginBottom: "10px" }}>
              هتفوّت هديتك المجانية
            </p>
            <p style={{ fontSize: "10px", color: "var(--fg-muted)", lineHeight: 1.8, marginBottom: "24px", letterSpacing: "0.03em" }}>
              لسه ما اخترتش اللون والمقاس بتاع هديتك. لو كملت دلوقتي، هيتحط الأوردر من غيرها.
            </p>
            <button
              onClick={() => setShowSkipWarning(false)}
              style={{
                display: "block", width: "100%", padding: "13px", marginBottom: "10px",
                fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase",
                fontFamily: "Space Mono, monospace", background: ACCENT, color: "#080808",
                border: "none", cursor: "pointer",
              }}
            >
              ارجع أختار هديتي
            </button>
            <button
              onClick={proceedToCheckout}
              disabled={checkingStock}
              style={{
                display: "block", width: "100%", padding: "13px",
                fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase",
                fontFamily: "Space Mono, monospace", background: "transparent", color: "var(--fg-muted)",
                border: "1px solid var(--border)", cursor: checkingStock ? "not-allowed" : "pointer",
              }}
            >
              {checkingStock ? "..." : "كمل من غير هدية"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}