"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/store/cart"

const colorImages: Record<string, string[]> = {
  BLACK: [
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-black.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-black-2.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-black-3.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-black-4.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-black-5.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-black-6.jpg",
  ],
  WHITE: [
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-white.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-white-2.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-white-3.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-white-4.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-white-5.jpg",
  ],
  GREY: [
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-grey.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-grey-2.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-grey-3.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-grey-4.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-grey-5.jpg",
  ],
  BEIGE: [
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-beige.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-beige-2.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-beige-3.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-beige-4.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-beige-5.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-beige-6.jpg",
  ],
}

const SIZE_CHART_IMAGE = "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/size-chart.jpg"

function optimizeCloudinaryUrl(url: string, width: number): string {
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`)
}

const sizes = ["M", "L", "XL"]
const colorsList = ["BLACK", "WHITE", "GREY", "BEIGE"]
const LOW_STOCK_THRESHOLD = 3
const ACCENT = "#c8f04f"

// عتبات العروض — لازم تتطابق مع الـ Promotion rows في الداتابيز
const TIERS = [
  { triggerQuantity: 3, freeQuantity: 2 },
  { triggerQuantity: 2, freeQuantity: 1 },
].sort((a, b) => b.triggerQuantity - a.triggerQuantity)

function getEligibleTier(paidQuantity: number) {
  return TIERS.find((t) => paidQuantity >= t.triggerQuantity) ?? null
}
function getNextTier(paidQuantity: number) {
  return TIERS.slice().sort((a, b) => a.triggerQuantity - b.triggerQuantity).find((t) => t.triggerQuantity > paidQuantity) ?? null
}

interface Variant {
  id: string
  size: string
  color: string
  stockQuantity: number
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  originalPrice: number | null
  category?: { name: string } | null
  variants: Variant[]
}

interface SuggestedProduct {
  id: string
  name: string
  price: number
  originalPrice: number | null
  category?: { name: string; slug: string } | null
  variants: { id: string; color: string; size: string; stockQuantity: number }[]
}

interface AvailableGiftVariant {
  variantId: string
  color: string
  size: string
  productName: string
}

export default function ProductDetailClient({
  product,
  suggestedProducts = [],
}: {
  product: Product
  suggestedProducts?: SuggestedProduct[]
}) {
  const variants = product.variants
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  const [sizeChartOpen, setSizeChartOpen] = useState(false)
  const [buying, setBuying] = useState(false)
  const { addItem, items, gifts, setGift, clearGifts, paidQuantity } = useCart()
  const router = useRouter()

  const selectedVariant   = variants.find((v) => v.size === selectedSize)
  const stockQuantity     = selectedVariant?.stockQuantity ?? 0
  const maxStock          = stockQuantity
  const isSoldOut         = selectedSize ? stockQuantity === 0 : false
  const isLowStock        = selectedSize ? stockQuantity > 0 && stockQuantity <= LOW_STOCK_THRESHOLD : false
  const quantityDisabled  = !selectedSize || isSoldOut
  const hasDiscount       = product.originalPrice && Number(product.originalPrice) > Number(product.price)

  const productColor = variants[0]?.color || "BLACK"
  const images = colorImages[productColor] || colorImages.BLACK
  const img = images[imgIndex] || images[0]

  // ─── Bundle progress ────────────────────────────────────────────────────
  // بيحسب على إجمالي قطع الكارت الحالي + القطعة اللي هيضيفها دلوقتي (لو مختار size)
  const projectedQuantity = paidQuantity() + (selectedSize && !isSoldOut ? quantity : 0)
  const currentCartQuantity = paidQuantity()

  const eligibleNow  = useMemo(() => getEligibleTier(currentCartQuantity), [currentCartQuantity])
  const eligibleNext = useMemo(() => getEligibleTier(projectedQuantity), [projectedQuantity])
  const nextTier      = useMemo(() => getNextTier(currentCartQuantity), [currentCartQuantity])

  const [availableGiftVariants, setAvailableGiftVariants] = useState<AvailableGiftVariant[]>([])
  const [loadingGiftVariants, setLoadingGiftVariants] = useState(false)

  useEffect(() => {
    if (!eligibleNow) return
    setLoadingGiftVariants(true)
    fetch("/api/products/gift-variants")
      .then((res) => res.json())
      .then((data) => setAvailableGiftVariants(data.variants || []))
      .catch(() => setAvailableGiftVariants([]))
      .finally(() => setLoadingGiftVariants(false))
  }, [eligibleNow])

  // ─── Stale gift cleanup ─────────────────────────────────────────────────
  // لو الكارت رجع مش مؤهل لأي عرض (اتشالت قطعة مثلاً)، أو عدد الهدايا المحفوظة
  // من عرض قديم أكبر من الـ freeQuantity الحالي، امسح الهدايا القديمة فورًا
  // عشان محتفضش بهدية إضافية من تير سابق كان أعلى.
  useEffect(() => {
    if (!eligibleNow) {
      if (gifts.length > 0) clearGifts()
      return
    }
    if (gifts.length > eligibleNow.freeQuantity) {
      clearGifts()
    }
  }, [eligibleNow, gifts.length, clearGifts])

  React.useEffect(() => {
    const preloadRest = () => {
      images.forEach((src, i) => {
        if (i === 0) return
        const preloadImg = new window.Image()
        preloadImg.src = optimizeCloudinaryUrl(src, 900)
      })
    }
    if (document.readyState === "complete") {
      const timer = setTimeout(preloadRest, 300)
      return () => clearTimeout(timer)
    } else {
      window.addEventListener("load", preloadRest, { once: true })
      return () => window.removeEventListener("load", preloadRest)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productColor])

  const goToImage = (index: number) => setImgIndex(index)
  const nextImage = () => goToImage((imgIndex + 1) % images.length)
  const prevImage = () => goToImage((imgIndex - 1 + images.length) % images.length)

  const buildCartItem = () => {
    const variant = variants.find((v) => v.size === selectedSize)
    if (!variant || variant.stockQuantity === 0) return null
    return {
      variantId: variant.id,
      productName: product.name,
      price: Number(product.price),
      color: variant.color,
      size: variant.size,
      quantity,
      imageUrl: images[0],
    }
  }

  const inCartQuantity = items.find((i) => i.variantId === selectedVariant?.id)?.quantity ?? 0

  const handleAdd = () => {
    const item = buildCartItem()
    if (!item) return
    addItem(item)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyNow = () => {
    if (buying) return
    const variant = variants.find((v) => v.size === selectedSize)
    if (!variant || variant.stockQuantity === 0) return

    const alreadyInCart = items.find((i) => i.variantId === variant.id)?.quantity ?? 0
    const toAdd = quantity - alreadyInCart

    if (toAdd > 0) {
      addItem({
        variantId: variant.id,
        productName: product.name,
        price: Number(product.price),
        color: variant.color,
        size: variant.size,
        quantity: toAdd,
        imageUrl: images[0],
      })
    }

    setBuying(true)
    router.push("/checkout")
  }

  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <style>{`
        @media (min-width: 768px) { .product-grid { grid-template-columns: 1fr 1fr !important; gap: 64px !important; } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes giftGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(200,240,79,0.15); } 50% { box-shadow: 0 0 0 6px rgba(200,240,79,0); } }
        @keyframes slideDown { from { opacity: 0; max-height: 0; transform: translateY(-6px); } to { opacity: 1; max-height: 600px; transform: translateY(0); } }
        @keyframes checkPop { 0% { transform: scale(0); } 60% { transform: scale(1.3); } 100% { transform: scale(1); } }

        .img-nav-btn {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(8,8,8,0.55); backdrop-filter: blur(6px);
          border: 1px solid rgba(240,237,230,0.15);
          color: #f0ede6; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.2s;
          z-index: 2;
        }
        .img-nav-btn:hover { background: rgba(8,8,8,0.8); }

        .img-dots { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 2; }
        .img-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(240,237,230,0.3); cursor: pointer; transition: background 0.2s; border: none; padding: 0; }
        .img-dot.active { background: #f0ede6; }

        .suggested-card { text-decoration: none; display: block; }
        .suggested-img { transition: transform 0.6s ease, opacity 0.4s ease; }
        .suggested-card:hover .suggested-img { transform: scale(1.04); opacity: 0.75 !important; }

        /* ── Sale badge on suggested product cards ── */
        @keyframes cardSaleShine {
          0%   { background-position: -60px 0; }
          100% { background-position: 160px 0; }
        }
        .card-sale-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #080808;
          background: ${ACCENT};
          padding: 4px 8px;
          overflow: hidden;
        }
        .card-sale-badge::after {
          content: "";
          position: absolute;
          top: 0; left: 0;
          width: 30px; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: cardSaleShine 2.6s ease-in-out infinite;
        }

        .suggested-name  { font-size: 14px; }
        .suggested-price { font-size: 12px; }
        .suggested-orig  { font-size: 10px; }
        @media (min-width: 640px) {
          .suggested-name  { font-size: 17px; }
          .suggested-price { font-size: 13px; }
          .suggested-orig  { font-size: 11px; }
        }

        /* ── Sale badge ── */
        @keyframes saleShine {
          0%   { background-position: -60px 0; }
          100% { background-position: 160px 0; }
        }
        .sale-badge {
          position: relative;
          display: inline-flex;
          align-items: center;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #080808;
          background: ${ACCENT};
          padding: 5px 10px;
          overflow: hidden;
        }
        .sale-badge::after {
          content: "";
          position: absolute;
          top: 0; left: 0;
          width: 40px; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: saleShine 2.6s ease-in-out infinite;
        }

        /* ── Bundle progress bar ── */
        .bundle-box {
          border: 1px solid rgba(240,237,230,0.12);
          padding: 16px 18px;
          margin-bottom: 10px;
          transition: border-color 0.3s ease;
        }
        .bundle-box.eligible {
          border-color: rgba(200,240,79,0.4);
          animation: giftGlow 2.5s ease infinite;
          animation-delay: 1s;
        }
        /* ── Unified multi-tier progress bar (shows both milestones together) ── */
        .tier-progress { position: relative; margin-top: 14px; padding-top: 4px; padding-bottom: 4px; }
        .tier-progress-track {
          position: relative;
          height: 4px;
          background: rgba(240,237,230,0.08);
          border-radius: 2px;
          overflow: visible;
        }
        .tier-progress-fill {
          height: 100%;
          background: ${ACCENT};
          border-radius: 2px;
          transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .tier-progress-marker {
          position: absolute;
          top: 50%;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: #080808;
          border: 2px solid rgba(240,237,230,0.25);
          transition: border-color 0.3s ease, background 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tier-progress-marker.reached {
          background: ${ACCENT};
          border-color: ${ACCENT};
        }
        .tier-progress-marker.reached::after {
          content: "✓";
          font-size: 8px;
          font-weight: 700;
          color: #080808;
        }

        /* ── Gift picker ── */
        .gift-picker { animation: slideDown 0.4s ease both; overflow: hidden; }
        .gift-swatch {
          width: 32px; height: 32px; border-radius: 50%;
          cursor: pointer; position: relative; flex-shrink: 0;
          transition: all 0.2s;
        }
        .gift-size-btn {
          min-width: 38px; height: 34px; padding: 0 8px; font-size: 10px;
          font-family: 'Space Mono', monospace; letter-spacing: 0.05em;
          cursor: pointer; transition: all 0.15s; background: transparent;
        }
        .check-pop { animation: checkPop 0.3s ease; }

        /* ── Promo banner (top of product page) — revamped, stronger visual hierarchy ── */
        .promo-banner {
          border: 1px solid rgba(200,240,79,0.22);
          background: rgba(200,240,79,0.04);
          margin-bottom: 20px;
          overflow: hidden;
        }
        .promo-banner-head {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(200,240,79,0.15);
        }
        .promo-banner-head-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: ${ACCENT};
          flex-shrink: 0;
        }
        .promo-banner-head-txt {
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(200,240,79,0.75);
        }
        .promo-banner-rows {
          display: flex;
          flex-direction: column;
        }
        .promo-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 16px;
          position: relative;
        }
        .promo-row + .promo-row {
          border-top: 1px solid rgba(240,237,230,0.06);
        }
        .promo-row-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          font-weight: 300;
          color: ${ACCENT};
          line-height: 1;
          min-width: 28px;
          flex-shrink: 0;
        }
        .promo-row-divider {
          width: 1px;
          height: 26px;
          background: rgba(200,240,79,0.2);
          flex-shrink: 0;
        }
        .promo-row-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .promo-row-title {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.05em;
          color: #f0ede6;
          white-space: nowrap;
        }
        .promo-row-sub {
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(240,237,230,0.35);
          white-space: nowrap;
        }
        @media (max-width: 420px) {
          .promo-row-num { font-size: 24px; min-width: 22px; }
          .promo-row-title { font-size: 10px; }
        }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "70px 20px 80px" }}>

        <Link href="/products" style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", textDecoration: "none", marginBottom: "20px", display: "inline-block" }}>
          ← Back to Products
        </Link>

        <PromoBanner />

        <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px", marginTop: "24px" }}>

          <div style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", background: "#0d0d0d" }}>
            <img
              src={optimizeCloudinaryUrl(img, 900)}
              alt={product.name}
              fetchPriority="high"
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9, display: "block" }}
            />
            <div style={{ position: "absolute", top: "16px", left: "16px", background: "rgba(8,8,8,0.7)", backdropFilter: "blur(8px)", padding: "6px 12px" }}>
              <span style={{ fontSize: "8px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.6)" }}>{product.category?.name}</span>
            </div>

            {images.length > 1 && (
              <>
                <button className="img-nav-btn" style={{ left: "12px" }} onClick={prevImage} aria-label="Previous image">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button className="img-nav-btn" style={{ right: "12px" }} onClick={nextImage} aria-label="Next image">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <div className="img-dots">
                  {images.map((_, i) => (
                    <button key={i} className={`img-dot ${i === imgIndex ? "active" : ""}`} onClick={() => goToImage(i)} aria-label={`Image ${i + 1}`} />
                  ))}
                </div>
              </>
            )}

            {isSoldOut && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(8,8,8,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: "12px", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(220,80,80,0.9)" }}>Sold Out</p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(36px, 6vw, 52px)", fontWeight: 300, lineHeight: 1, marginBottom: "16px", color: "#f0ede6", letterSpacing: "-0.01em" }}>
                {product.name}
              </h1>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                {hasDiscount && (
                  <span style={{ fontSize: "16px", color: "rgba(240,237,230,0.3)", textDecoration: "line-through", fontFamily: "Cormorant Garamond, serif" }}>
                    {Number(product.originalPrice)}
                  </span>
                )}
                <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "32px", fontWeight: 300, color: "#f0ede6" }}>{Number(product.price)}</span>
                <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(240,237,230,0.4)" }}>EGP</span>
                {hasDiscount && (
                  <span className="sale-badge">
                    Sale
                  </span>
                )}
              </div>
            </div>

            <div style={{ height: "1px", background: "rgba(240,237,230,0.06)", marginBottom: "28px" }} />

            {product.description && (
              <p style={{ fontSize: "11px", lineHeight: 2, color: "rgba(240,237,230,0.5)", marginBottom: "28px", letterSpacing: "0.05em" }}>
                {product.description}
              </p>
            )}

            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.5)", margin: 0 }}>Size</p>
                <button
                  onClick={() => setSizeChartOpen(true)}
                  style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.5)", background: "none", border: "none", borderBottom: "1px solid rgba(240,237,230,0.3)", cursor: "pointer", padding: 0 }}
                >
                  Size Chart
                </button>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {sizes.map((size) => {
                  const variant = variants.find((v) => v.size === size)
                  const stock = variant?.stockQuantity ?? 0
                  const disabled = stock === 0
                  const isSelected = selectedSize === size
                  return (
                    <button
                      key={size}
                      onClick={() => { if (!disabled) { setSelectedSize(size); setQuantity(1) } }}
                      disabled={disabled}
                      style={{
                        flex: 1, padding: "14px 0", fontSize: "11px", fontFamily: "Space Mono, monospace",
                        letterSpacing: "0.1em", cursor: disabled ? "not-allowed" : "pointer",
                        background: isSelected ? "#f0ede6" : "transparent",
                        color: disabled ? "rgba(240,237,230,0.15)" : isSelected ? "#080808" : "#f0ede6",
                        border: isSelected ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.15)",
                        textDecoration: disabled ? "line-through" : "none",
                        transition: "all 0.2s",
                      }}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedSize && isLowStock && !isSoldOut && (
              <p style={{ fontSize: "9px", letterSpacing: "0.1em", color: "rgba(220,120,80,0.85)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(220,120,80,0.85)", display: "inline-block", animation: "pulse 1.5s ease infinite" }} />
                Only {stockQuantity} left in stock
              </p>
            )}

            <div style={{ marginBottom: "28px" }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.5)", marginBottom: "12px" }}>Quantity</p>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", opacity: quantityDisabled ? 0.3 : 1 }}>
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantityDisabled}
                  style={{ width: "36px", height: "36px", background: "transparent", border: "1px solid rgba(240,237,230,0.15)", color: "#f0ede6", cursor: quantityDisabled ? "not-allowed" : "pointer", fontSize: "14px" }}
                >
                  −
                </button>
                <span style={{ fontSize: "13px", minWidth: "20px", textAlign: "center" }}>{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(99, maxStock, q + 1))}
                  disabled={quantityDisabled || quantity >= maxStock || quantity >= 99}
                  style={{ width: "36px", height: "36px", background: "transparent", border: "1px solid rgba(240,237,230,0.15)", color: "#f0ede6", cursor: (quantityDisabled || quantity >= maxStock) ? "not-allowed" : "pointer", fontSize: "14px" }}
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={quantityDisabled}
              style={{
                width: "100%", padding: "16px", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase",
                fontFamily: "Space Mono, monospace", cursor: quantityDisabled ? "not-allowed" : "pointer",
                background: added ? "rgba(100,200,150,0.9)" : quantityDisabled ? "rgba(240,237,230,0.1)" : "#f0ede6",
                color: added ? "#080808" : quantityDisabled ? "rgba(240,237,230,0.3)" : "#080808",
                border: "none", transition: "all 0.3s", marginBottom: "10px",
              }}
            >
              {added ? "✓ Added to Cart" : isSoldOut ? "Sold Out" : !selectedSize ? "Select a Size" : "Add to Cart"}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={quantityDisabled || buying}
              style={{
                width: "100%", padding: "16px", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase",
                fontFamily: "Space Mono, monospace", cursor: (quantityDisabled || buying) ? "not-allowed" : "pointer",
                background: "transparent",
                color: (quantityDisabled || buying) ? "rgba(240,237,230,0.2)" : "#f0ede6",
                border: `1px solid ${(quantityDisabled || buying) ? "rgba(240,237,230,0.1)" : "rgba(240,237,230,0.4)"}`,
                transition: "all 0.3s",
                marginBottom: "16px",
              }}
            >
              {buying ? "Redirecting…" : "Buy It Now"}
            </button>

            {/* ── BUNDLE PROGRESS + GIFT PICKER ── */}
            <BundleSection
              currentCartQuantity={currentCartQuantity}
              eligibleNow={eligibleNow}
              nextTier={nextTier}
              gifts={gifts}
              setGift={setGift}
              availableGiftVariants={availableGiftVariants}
              loadingGiftVariants={loadingGiftVariants}
            />

          </div>

        </div>

        {suggestedProducts.length > 0 && (
          <div style={{ marginTop: "96px" }}>
            <div style={{ marginBottom: "28px", borderBottom: "1px solid rgba(240,237,230,0.06)", paddingBottom: "20px" }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "10px" }}>
                You Might Also Like
              </p>
              <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 300, color: "#f0ede6", margin: 0 }}>
                Complete The Look
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2px" }}>
              {suggestedProducts.slice(0, 4).map((p) => {
                const color = p.variants?.[0]?.color || "BLACK"
                const colorLabel = color ? color.charAt(0) + color.slice(1).toLowerCase() : ""
                const productImgs = colorImages[color] || colorImages.BLACK
                const hasDisc = p.originalPrice && p.originalPrice > p.price
                return (
                  <Link href={`/products/${p.id}`} key={p.id} className="suggested-card">
                    <div style={{ aspectRatio: "3/4", overflow: "hidden", background: "#111", position: "relative" }}>
                      {hasDisc && <span className="card-sale-badge">Sale</span>}
                      <img
                        src={optimizeCloudinaryUrl(productImgs[0], 500)}
                        alt={`Oversize T-Shirt — ${colorLabel}`}
                        loading="lazy"
                        className="suggested-img"
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080808 0%, transparent 55%)" }} />
                      <div style={{ position: "absolute", bottom: "14px", left: "14px", right: "14px" }}>
                        <p className="suggested-name" style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 300, color: "#f0ede6", margin: "0 0 5px", lineHeight: 1.15 }}>
                          Oversize T-Shirt<br />
                          <span style={{ color: "rgba(240,237,230,0.5)" }}>— {colorLabel}</span>
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "7px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)" }}>
                            {colorLabel}
                          </span>
                          {hasDisc ? (
                            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <span className="suggested-orig" style={{ color: "rgba(240,237,230,0.3)", textDecoration: "line-through" }}>{p.originalPrice}</span>
                              <span className="suggested-price" style={{ color: "rgba(240,237,230,0.7)" }}>{p.price} EGP</span>
                            </span>
                          ) : (
                            <span className="suggested-price" style={{ color: "rgba(240,237,230,0.5)" }}>{p.price} EGP</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {sizeChartOpen && (
        <div
          onClick={() => setSizeChartOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(8,8,8,0.9)", backdropFilter: "blur(6px)",
            zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "600px", width: "100%" }}>
            <button
              onClick={() => setSizeChartOpen(false)}
              style={{
                position: "absolute", top: "-40px", right: "0", background: "none", border: "none",
                color: "#f0ede6", cursor: "pointer", fontSize: "13px", letterSpacing: "0.2em", textTransform: "uppercase",
              }}
            >
              Close ✕
            </button>
            <img
              src={optimizeCloudinaryUrl(SIZE_CHART_IMAGE, 700)}
              alt="Size Chart"
              style={{ width: "100%", height: "auto", display: "block", border: "1px solid rgba(240,237,230,0.1)" }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Bundle progress bar + inline gift picker (lives right under Buy It Now)
// ─────────────────────────────────────────────────────────────────────────

const SWATCH_COLORS: Record<string, string> = {
  BLACK: "#1a1a1a",
  WHITE: "#f0ede6",
  GREY:  "#8a8a85",
  BEIGE: "#d8c8a8",
}

function activeFreeQty(eligibleNow: { triggerQuantity: number; freeQuantity: number } | null): string {
  if (!eligibleNow) return ""
  return eligibleNow.freeQuantity === 1 ? "1 free tee" : `${eligibleNow.freeQuantity} free tees`
}

function BundleSection({
  currentCartQuantity,
  eligibleNow,
  nextTier,
  gifts,
  setGift,
  availableGiftVariants,
  loadingGiftVariants,
}: {
  currentCartQuantity: number
  eligibleNow: { triggerQuantity: number; freeQuantity: number } | null
  nextTier: { triggerQuantity: number; freeQuantity: number } | null
  gifts: { variantId: string; productName: string; color: string; size: string; imageUrl?: string }[]
  setGift: (index: number, gift: { variantId: string; productName: string; color: string; size: string; imageUrl?: string }) => void
  availableGiftVariants: AvailableGiftVariant[]
  loadingGiftVariants: boolean
}) {
  // لو مفيش أي تير خالص متعرف في النظام، منعرضش حاجة
  if (TIERS.length === 0) return null

  // كل التيرز مرتبة تصاعدي عشان نرسم البار من الأصغر للأكبر
  const sortedTiers = TIERS.slice().sort((a, b) => a.triggerQuantity - b.triggerQuantity)
  const maxTrigger = sortedTiers[sortedTiers.length - 1].triggerQuantity
  const fillPercent = Math.min(100, (currentCartQuantity / maxTrigger) * 100)

  // أعلى تير متبقي بعد آخر تير محقق — ده اللي بنوريله "كمان X تضيف"
  const upcomingTier = sortedTiers.find((t) => t.triggerQuantity > currentCartQuantity) ?? null
  const remaining = upcomingTier ? upcomingTier.triggerQuantity - currentCartQuantity : 0

  return (
    <div className={`bundle-box ${eligibleNow ? "eligible" : ""}`}>
      {/* رسالة الحالة الحالية — دايمًا واضحة سواء لسه مفيش عرض اتحقق أو خدت عرض وفيه عرض أكبر جاي */}
      {upcomingTier ? (
        <p style={{ fontSize: "10px", letterSpacing: "0.05em", color: "rgba(240,237,230,0.6)", margin: 0 }}>
          🎁 {eligibleNow ? "One more and" : "Add"} <span style={{ color: ACCENT }}>{remaining}</span> more to unlock {upcomingTier.freeQuantity === 1 ? "a free tee" : `${upcomingTier.freeQuantity} free tees`}
        </p>
      ) : (
        <p style={{ fontSize: "10px", letterSpacing: "0.05em", color: ACCENT, margin: 0 }}>
          🎉 Max offer unlocked — {activeFreeQty(eligibleNow)}
        </p>
      )}

      {/* بار موحّد بيوري كل المراحل مع بعض */}
      <div className="tier-progress">
        <div className="tier-progress-track">
          <div className="tier-progress-fill" style={{ width: `${fillPercent}%` }} />
          {sortedTiers.map((t) => {
            const reached = currentCartQuantity >= t.triggerQuantity
            const leftPct = (t.triggerQuantity / maxTrigger) * 100
            return (
              <div
                key={t.triggerQuantity}
                className={`tier-progress-marker ${reached ? "reached" : ""}`}
                style={{ left: `${leftPct}%` }}
              />
            )
          })}
        </div>
      </div>

      {eligibleNow && (
        <>
          <div className="gift-picker" style={{ marginTop: "18px" }}>
            {loadingGiftVariants ? (
              <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.3)" }}>Loading options...</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {Array.from({ length: eligibleNow.freeQuantity }).map((_, idx) => {
                  const currentGift = gifts[idx]
                  const colorOptions = colorsList.filter((c) => availableGiftVariants.some((v) => v.color === c))
                  const sizeOptionsForColor = currentGift?.color
                    ? availableGiftVariants.filter((v) => v.color === currentGift.color).map((v) => v.size)
                    : []
                  const isDone = !!currentGift?.variantId

                  return (
                    <div key={idx}>
                      {eligibleNow.freeQuantity > 1 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
                          <div className={isDone ? "check-pop" : ""} style={{
                            width: "15px", height: "15px", borderRadius: "50%", flexShrink: 0,
                            border: `1px solid ${isDone ? ACCENT : "rgba(240,237,230,0.25)"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: isDone ? ACCENT : "transparent",
                          }}>
                            {isDone && <span style={{ fontSize: "9px", color: "#080808", lineHeight: 1 }}>✓</span>}
                          </div>
                          <p style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", margin: 0 }}>
                            Free Gift {idx + 1}
                          </p>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
                        <div>
                          <p style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)", marginBottom: "7px" }}>
                            {currentGift?.color ? currentGift.color.charAt(0) + currentGift.color.slice(1).toLowerCase() : "Color"}
                          </p>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {colorOptions.map((c) => {
                              const isSelected = currentGift?.color === c
                              return (
                                <button
                                  key={c}
                                  className="gift-swatch"
                                  onClick={() => {
                                    const firstAvailable = availableGiftVariants.find((v) => v.color === c)
                                    const giftImages = colorImages[c] || colorImages.BLACK
                                    setGift(idx, {
                                      variantId: firstAvailable?.variantId || "",
                                      productName: firstAvailable?.productName || "Oversize T-Shirt",
                                      color: c,
                                      size: firstAvailable?.size || "",
                                      imageUrl: giftImages[0],
                                    })
                                  }}
                                  aria-label={c}
                                  style={{
                                    background: SWATCH_COLORS[c],
                                    border: isSelected ? `2px solid ${ACCENT}` : "1px solid rgba(240,237,230,0.2)",
                                    boxShadow: isSelected ? "0 0 0 3px rgba(200,240,79,0.15)" : "none",
                                  }}
                                >
                                  {isSelected && (
                                    <span style={{
                                      position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                                      color: c === "WHITE" || c === "BEIGE" ? "#080808" : "#f0ede6", fontSize: "11px",
                                    }}>✓</span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div>
                          <p style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)", marginBottom: "7px" }}>
                            Size
                          </p>
                          <div style={{ display: "flex", gap: "6px", opacity: currentGift?.color ? 1 : 0.35 }}>
                            {sizes.map((s) => {
                              const isAvailable = sizeOptionsForColor.includes(s)
                              const isSelected = currentGift?.size === s
                              const disabled = !currentGift?.color || !isAvailable
                              return (
                                <button
                                  key={s}
                                  className="gift-size-btn"
                                  disabled={disabled}
                                  onClick={() => {
                                    const variant = availableGiftVariants.find((v) => v.color === currentGift?.color && v.size === s)
                                    if (currentGift) setGift(idx, { ...currentGift, variantId: variant?.variantId || "", size: s })
                                  }}
                                  style={{
                                    cursor: disabled ? "not-allowed" : "pointer",
                                    background: isSelected ? ACCENT : "transparent",
                                    color: !isAvailable ? "rgba(240,237,230,0.15)" : isSelected ? "#080808" : "#f0ede6",
                                    border: isSelected ? `1px solid ${ACCENT}` : "1px solid rgba(240,237,230,0.15)",
                                    textDecoration: !isAvailable && currentGift?.color ? "line-through" : "none",
                                  }}
                                >
                                  {s}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Promo banner — static, both tiers shown side by side, calm and legible
// ─────────────────────────────────────────────────────────────────────────

function PromoBanner() {
  return (
    <div className="promo-banner">
      <div className="promo-banner-head">
        <span className="promo-banner-head-dot" />
        <span className="promo-banner-head-txt">Bundle & Save</span>
      </div>
      <div className="promo-banner-rows">
        <div className="promo-row">
          <span className="promo-row-num">2</span>
          <span className="promo-row-divider" />
          <div className="promo-row-body">
            <span className="promo-row-title">Buy 2, get 1 free</span>
            <span className="promo-row-sub">Mix any colors & sizes</span>
          </div>
        </div>
        <div className="promo-row">
          <span className="promo-row-num">3</span>
          <span className="promo-row-divider" />
          <div className="promo-row-body">
            <span className="promo-row-title">Buy 3, get 2 free</span>
            <span className="promo-row-sub">Mix any colors & sizes</span>
          </div>
        </div>
      </div>
    </div>
  )
}