"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/store/cart"
import { getEligibleGiftTier, areGiftsComplete } from "@/lib/giftTiers"

const ACCENT = "#c8f04f"
const colorsList = ["BLACK", "WHITE", "GREY", "BEIGE"]
const giftSizes = ["M", "L", "XL", "XXL"]

const SWATCH_COLORS: Record<string, string> = {
  BLACK: "#1a1a1a",
  WHITE: "#f0ede6",
  GREY:  "#8a8a85",
  BEIGE: "#d8c8a8",
}

interface AvailableGiftVariant {
  variantId: string
  color: string
  size: string
  productName: string
  stockQuantity: number
}

// نفس صور الألوان المستخدمة في باقي الموقع — بتستخدم كـ fallback
// لو العنصر (خصوصًا الهدايا القديمة المحفوظة قبل الإصلاح) معندوش imageUrl
const colorImages: Record<string, string> = {
  BLACK: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-black.jpg",
  WHITE: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-white.jpg",
  GREY:  "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-grey.jpg",
  BEIGE: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-beige.jpg",
}

function optimizeCloudinaryUrl(url: string, width: number): string {
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`)
}

function resolveImage(color: string, provided?: string): string {
  const src = provided || colorImages[color] || colorImages.BLACK
  return optimizeCloudinaryUrl(src, 200)
}

export default function CartPage() {
  const { items, gifts, removeItem, updateQuantity, setGift, clearGifts, total } = useCart()
  const router = useRouter()

  // ─── Stale gift cleanup ─────────────────────────────────────────────────
  // نفس الحماية اللي في صفحة المنتج — لو الكمية اتغيرت هنا (زيادة/نقصان/حذف)
  // وبقى عدد الهدايا المحفوظة أكتر من المستحق، امسحهم فورًا.
  const paidQty = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])
  // بتستخدم نفس GIFT_TIERS الموجودة في lib/giftTiers.ts (مصدر مشترك مع صفحة المنتج) —
  // قبل كده كان فيه صيغة منفصلة قديمة هنا (Buy 2 Get 1 / Buy 3 Get 2) مش متطابقة مع
  // العرض الحقيقي (Buy 2 Get 3 / Buy 3 Get 5)، فكانت بتمسح هدايا العميل كلها لحظة
  // ما يوصل الـ Cart.
  const eligibleTier = getEligibleGiftTier(paidQty)
  const expectedFreeQty = eligibleTier?.freeQuantity ?? 0
  const validGifts = useMemo(() => gifts.filter((g) => g && g.variantId).slice(0, expectedFreeQty), [gifts, expectedFreeQty])
  const giftsComplete = areGiftsComplete(paidQty, gifts)

  useEffect(() => {
    if (gifts.filter((g) => g && g.variantId).length > expectedFreeQty) {
      clearGifts()
    }
  }, [expectedFreeQty, gifts, clearGifts])

  // ─── Gift variants fetch (لو العميل مستحق هدية ولسه مختارهاش) ───────────
  // نفس الـ endpoint المستخدم في صفحة المنتج — مطلوب هنا كمان العميل يقدر يختار
  // الهدية ولو دخل الكارت مباشرة من غير ما يعدي على صفحة المنتج.
  const [availableGiftVariants, setAvailableGiftVariants] = useState<AvailableGiftVariant[]>([])
  const [loadingGiftVariants, setLoadingGiftVariants] = useState(false)
  const [openGiftSlot, setOpenGiftSlot] = useState<number | null>(0)

  useEffect(() => {
    if (!eligibleTier) return
    setLoadingGiftVariants(true)
    fetch("/api/products/gift-variants")
      .then((res) => res.json())
      .then((data) => setAvailableGiftVariants(data.variants || []))
      .catch(() => setAvailableGiftVariants([]))
      .finally(() => setLoadingGiftVariants(false))
  }, [eligibleTier])

  const getRemainingStock = (variantId: string, excludeSlotIdx: number) => {
    const variant = availableGiftVariants.find((v) => v.variantId === variantId)
    if (!variant) return 0
    const reservedByCart = items.find((i) => i.variantId === variantId)?.quantity ?? 0
    const reservedByOtherGiftSlots = gifts.reduce(
      (count, g, i) => (i !== excludeSlotIdx && g?.variantId === variantId ? count + 1 : count),
      0
    )
    return variant.stockQuantity - reservedByCart - reservedByOtherGiftSlots
  }

  const subtotal = total()
  const giftDisplayValue = validGifts.reduce((sum, g) => {
    const referenceItem = items.find((i) => i.color === g.color && i.size === g.size) || items[0]
    return sum + (referenceItem?.price || 0)
  }, 0)

  // ─── Checkout gate ────────────────────────────────────────────────────
  // لو مستحق هدية ولسه مختارهاش، منروحشش checkout — نفتح أول slot ناقص ليسكرول له
  // العميل يشوفه فورًا
  const handleProceedToCheckout = () => {
    if (!giftsComplete) {
      const firstIncomplete = gifts.findIndex((g, i) => i < expectedFreeQty && !g?.variantId)
      setOpenGiftSlot(firstIncomplete === -1 ? 0 : firstIncomplete)
      return
    }
    router.push("/checkout")
  }

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
                  <img
                    src={resolveImage(item.color, item.imageUrl || item.image)}
                    alt={item.productName}
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                  />
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
                <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: ACCENT, margin: "20px 0 12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "7px" }}>
                  <span style={{ fontSize: "13px" }}>🎁</span> Free Gifts — {validGifts.length}x
                </p>
                <div style={{ border: `1px solid rgba(200,240,79,0.3)`, background: "rgba(200,240,79,0.03)", padding: "4px 14px" }}>
                  {validGifts.map((g, idx) => (
                    <div
                      key={`gift-${idx}`}
                      style={{
                        display: "flex", gap: "16px", padding: "14px 0",
                        borderBottom: idx === validGifts.length - 1 ? "none" : "1px solid rgba(200,240,79,0.12)",
                      }}
                    >
                      <div style={{ width: "80px", height: "100px", flexShrink: 0, background: "#111", overflow: "hidden", position: "relative" }}>
                        <img
                          src={resolveImage(g.color, g.imageUrl || g.image)}
                          alt={g.productName}
                          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }}
                        />
                        <span style={{ position: "absolute", top: "5px", left: "5px", background: ACCENT, color: "#080808", fontSize: "6.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 5px" }}>Free</span>
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
              </div>
            )}

            {eligibleTier && !giftsComplete && (
              <CartGiftPicker
                totalSlots={expectedFreeQty}
                completedCount={validGifts.length}
                gifts={gifts}
                setGift={setGift}
                availableGiftVariants={availableGiftVariants}
                loadingGiftVariants={loadingGiftVariants}
                getRemainingStock={getRemainingStock}
                openSlot={openGiftSlot}
                setOpenSlot={setOpenGiftSlot}
              />
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

            {!giftsComplete && (
              <p style={{
                fontSize: "9.5px", letterSpacing: "0.02em", lineHeight: 1.6, color: "rgba(240,237,230,0.85)",
                background: "rgba(224,160,82,0.08)", border: "1px solid rgba(224,160,82,0.35)",
                padding: "10px 12px", marginBottom: "14px",
              }}>
                🎁 Pick your free gift{expectedFreeQty > 1 ? "s" : ""} above before checking out
              </p>
            )}

            <button
              onClick={handleProceedToCheckout}
              style={{
                width: "100%", padding: "14px", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase",
                fontFamily: "Space Mono, monospace", background: "#f0ede6", color: "#080808",
                border: "none", cursor: "pointer", transition: "opacity 0.2s",
                opacity: giftsComplete ? 1 : 0.7,
              }}
            >
              {giftsComplete ? "Proceed to Checkout" : "Select Your Free Gift to Continue"}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────
// Cart gift picker — نفس كونسبت الـ accordion rows الموجود في صفحة المنتج
// (ProductDetailClient → BundleSection)، بس نسخة مستقلة مصممة لمساحة
// الكارت. بتظهر لما العميل مستحق هدية ولسه مختارهاش بالكامل — سواء لأنه
// دخل الكارت مباشرة من غير ما يعدي على صفحة المنتج، أو زود قطعة من هنا
// الصفحة نفسها ورجع الكارت.
// ─────────────────────────────────────────────────────

interface CartGiftEntry {
  variantId: string
  productName: string
  color: string
  size: string
  imageUrl?: string
  image?: string
}

function CartGiftPicker({
  totalSlots,
  completedCount,
  gifts,
  setGift,
  availableGiftVariants,
  loadingGiftVariants,
  getRemainingStock,
  openSlot,
  setOpenSlot,
}: {
  totalSlots: number
  completedCount: number
  gifts: CartGiftEntry[]
  setGift: (index: number, gift: CartGiftEntry) => void
  availableGiftVariants: AvailableGiftVariant[]
  loadingGiftVariants: boolean
  getRemainingStock: (variantId: string, excludeSlotIdx: number) => number
  openSlot: number | null
  setOpenSlot: (idx: number | null) => void
}) {
  return (
    <div className="cart-gift-picker">
      <style>{`
        @keyframes cartGiftIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .cart-gift-picker { margin-top: 20px; border: 1px solid rgba(200,240,79,0.35); background: rgba(200,240,79,0.03); padding: 16px; animation: cartGiftIn 0.3s ease both; }
        .cart-gift-picker-title { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: ${ACCENT}; font-weight: 700; margin: 0 0 12px; display: flex; align-items: center; gap: 7px; }
        .cart-gift-slot { border: 1px solid rgba(240,237,230,0.08); margin-bottom: 8px; background: rgba(0,0,0,0.15); }
        .cart-gift-slot:last-child { margin-bottom: 0; }
        .cart-gift-slot-header { display: flex; align-items: center; gap: 10px; padding: 10px 12px; cursor: pointer; background: transparent; border: none; width: 100%; text-align: left; font-family: 'Space Mono', monospace; }
        .cart-gift-slot-check { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(240,237,230,0.25); }
        .cart-gift-slot-check.done { background: ${ACCENT}; border-color: ${ACCENT}; }
        .cart-gift-slot-label { font-size: 9.5px; letter-spacing: 0.08em; text-transform: uppercase; color: #f0ede6; flex: 1; }
        .cart-gift-slot-value { font-size: 9px; color: rgba(240,237,230,0.5); letter-spacing: 0.04em; }
        .cart-gift-slot-value.done { color: ${ACCENT}; }
        .cart-gift-slot-body { padding: 4px 12px 14px; border-top: 1px solid rgba(240,237,230,0.06); }
        .cart-gift-swatch { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; position: relative; flex-shrink: 0; transition: all 0.2s; }
        .cart-gift-swatch-oos::after { content: ""; position: absolute; left: -2px; right: -2px; top: 50%; height: 1.5px; background: rgba(240,237,230,0.7); transform: translateY(-50%) rotate(-45deg); pointer-events: none; }
        .cart-gift-size-btn { min-width: 34px; height: 30px; padding: 0 8px; font-size: 10px; font-family: 'Space Mono', monospace; letter-spacing: 0.05em; cursor: pointer; transition: all 0.15s; background: transparent; }
      `}</style>

      <p className="cart-gift-picker-title">
        <span style={{ fontSize: "13px" }}>🎁</span> {completedCount} / {totalSlots} free gift{totalSlots > 1 ? "s" : ""} selected
      </p>

      {loadingGiftVariants ? (
        <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.3)" }}>Loading options...</p>
      ) : (
        Array.from({ length: totalSlots }).map((_, idx) => {
          const currentGift = gifts[idx]
          const colorOptions = colorsList.filter((c) => availableGiftVariants.some((v) => v.color === c))
          const sizeOptionsForColor = currentGift?.color
            ? availableGiftVariants
                .filter((v) => v.color === currentGift.color && getRemainingStock(v.variantId, idx) > 0)
                .map((v) => v.size)
            : []
          const colorHasRemainingStock = (c: string) =>
            availableGiftVariants.some((v) => v.color === c && getRemainingStock(v.variantId, idx) > 0)
          const isDone = !!currentGift?.variantId
          const isOpen = openSlot === idx
          const summaryLabel = isDone
            ? `${currentGift.color.charAt(0) + currentGift.color.slice(1).toLowerCase()} / ${currentGift.size}`
            : "Tap to choose"

          return (
            <div key={idx} className="cart-gift-slot">
              <button type="button" className="cart-gift-slot-header" onClick={() => setOpenSlot(isOpen ? null : idx)}>
                <span className={`cart-gift-slot-check ${isDone ? "done" : ""}`}>
                  {isDone && <span style={{ fontSize: "8px", color: "#080808", lineHeight: 1 }}>✓</span>}
                </span>
                <span className="cart-gift-slot-label">
                  {totalSlots > 1 ? `Free Gift ${idx + 1}` : "Your Free Gift"}
                </span>
                <span className={`cart-gift-slot-value ${isDone ? "done" : ""}`}>{summaryLabel}</span>
              </button>

              {isOpen && (
                <div className="cart-gift-slot-body">
                  <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
                    <div>
                      <p style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.9)", marginBottom: "7px" }}>Color</p>
                      <div style={{ display: "flex", gap: "7px" }}>
                        {colorOptions.map((c) => {
                          const isSelected = currentGift?.color === c
                          const isOutOfStockForSlot = !isSelected && !colorHasRemainingStock(c)
                          return (
                            <button
                              key={c}
                              className={`cart-gift-swatch ${isOutOfStockForSlot ? "cart-gift-swatch-oos" : ""}`}
                              disabled={isOutOfStockForSlot}
                              title={isOutOfStockForSlot ? "Out of stock" : c.charAt(0) + c.slice(1).toLowerCase()}
                              onClick={() => {
                                if (isOutOfStockForSlot) return
                                const firstAvailable = availableGiftVariants.find((v) => v.color === c && getRemainingStock(v.variantId, idx) > 0)
                                setGift(idx, {
                                  variantId: firstAvailable?.variantId || "",
                                  productName: firstAvailable?.productName || "Oversize T-Shirt",
                                  color: c,
                                  size: firstAvailable?.size || "",
                                  imageUrl: colorImages[c] || colorImages.BLACK,
                                })
                              }}
                              aria-label={c}
                              style={{
                                background: SWATCH_COLORS[c],
                                border: isSelected ? `2px solid ${ACCENT}` : "1px solid rgba(240,237,230,0.2)",
                                boxShadow: isSelected ? "0 0 0 3px rgba(200,240,79,0.15)" : "none",
                                cursor: isOutOfStockForSlot ? "not-allowed" : "pointer",
                                opacity: isOutOfStockForSlot ? 0.35 : 1,
                              }}
                            >
                              {isSelected && (
                                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: c === "WHITE" || c === "BEIGE" ? "#080808" : "#f0ede6", fontSize: "10px" }}>✓</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <p style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.9)", marginBottom: "7px" }}>Size</p>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {giftSizes.map((s) => {
                          const colorPicked = !!currentGift?.color
                          const isOutOfStock = colorPicked && !sizeOptionsForColor.includes(s)
                          const isSelected = currentGift?.size === s
                          const disabled = !colorPicked || isOutOfStock
                          return (
                            <button
                              key={s}
                              className="cart-gift-size-btn"
                              disabled={disabled}
                              title={isOutOfStock ? "Out of stock" : undefined}
                              onClick={() => {
                                const variant = availableGiftVariants.find((v) => v.color === currentGift?.color && v.size === s)
                                if (currentGift) setGift(idx, { ...currentGift, variantId: variant?.variantId || "", size: s })
                              }}
                              style={{
                                cursor: disabled ? "not-allowed" : "pointer",
                                background: isSelected ? ACCENT : "transparent",
                                color: isOutOfStock ? "rgba(240,237,230,0.4)" : !colorPicked ? "rgba(240,237,230,0.35)" : isSelected ? "#080808" : "#f0ede6",
                                borderColor: isSelected ? ACCENT : "rgba(240,237,230,0.3)",
                                textDecoration: isOutOfStock ? "line-through" : "none",
                              }}
                            >
                              {s}
                            </button>
                          )
                        })}
                      </div>
                      {!currentGift?.color && (
                        <p style={{ fontSize: "8px", color: "rgba(240,237,230,0.4)", marginTop: "7px" }}>Pick a color first</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}