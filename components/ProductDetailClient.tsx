"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/store/cart"
import { trackViewContent, trackAddToCart } from "@/lib/meta-pixel"
import ActiveOfferBanner from "@/components/ActiveOfferBanner"
import SizeRecommendationModal from "@/components/Sizerecommendationmodal"


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

function optimizeCloudinaryUrl(url: string, width: number): string {
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`)
}

const sizes = ["M", "L", "XL", "XXL"] // XXL مضاف UI بس دلوقتي — مفيش variant ليه في الداتابيز فبيظهر Sold Out دايمًا تلقائيًا لحد 21 يضيفوه في الداتابيز
const giftSizes = ["M", "L", "XL", "XXL"] // مقاسات الهدية المجانية — XXL مضاف UI بس زي sizes الأساسية، مفيش له variant حقيقي فبيظهر Out of Stock دايمًا لحد ما يتضاف في الداتابيز
const colorsList = ["BLACK", "WHITE", "GREY", "BEIGE"]
const LOW_STOCK_THRESHOLD = 3
const ACCENT = "#c8f04f"

// عتبة العرض — لازم تتطابق مع الـ Promotion row الفعّال في الداتابيز (isActive: true).
// Buy 2 Get 1 بس — تير واحد. لو اتضاف تير تاني في الداتابيز لازم يتضاف هنا برضه عشان
// الـ progress bar يعرضه صح.
const TIERS = [
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
  // Default على M لو متوفر بالمخزون — بيخلي زراير الشراء وواجهة الاختيار ظاهرة وواضحة
  // فورًا من غير ما اليوزر يحس إن الصفحة "معطلة" لحد ما يختار مقاس بنفسه
  const defaultSize = variants.find((v) => v.size === "M" && v.stockQuantity > 0) ? "M" : ""
  const [selectedSize, setSelectedSize] = useState(defaultSize)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  const [sizeGuideTab, setSizeGuideTab] = useState<"CHART" | "FINDER" | null>(null)
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

  // ─── Bundle progress ────────────────────────────────────────────────────
  // بيحسب على إجمالي قطع الكارت الحالي + القطعة اللي هيضيفها دلوقتي (لو مختار size)
  const projectedQuantity = paidQuantity() + (selectedSize && !isSoldOut ? quantity : 0)
  const currentCartQuantity = paidQuantity()

  const eligibleNow  = useMemo(() => getEligibleTier(currentCartQuantity), [currentCartQuantity])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const eligibleNext = useMemo(() => getEligibleTier(projectedQuantity), [projectedQuantity])
  const nextTier      = useMemo(() => getNextTier(currentCartQuantity), [currentCartQuantity])

  const [availableGiftVariants, setAvailableGiftVariants] = useState<AvailableGiftVariant[]>([])
  const [loadingGiftVariants, setLoadingGiftVariants] = useState(false)

  useEffect(() => {
    if (!eligibleNow) return
    queueMicrotask(() => {
      setLoadingGiftVariants(true)
      fetch("/api/products/gift-variants")
        .then((res) => res.json())
        .then((data) => setAvailableGiftVariants(data.variants || []))
        .catch(() => setAvailableGiftVariants([]))
        .finally(() => setLoadingGiftVariants(false))
    })
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

  // ─── Meta Pixel: ViewContent ────────────────────────────────────────────
  useEffect(() => {
    trackViewContent({
      content_ids: [product.id],
      content_name: product.name,
      value: Number(product.price),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])

  const goToImage = (index: number) => setImgIndex(index)
  const nextImage = () => goToImage((imgIndex + 1) % images.length)
  const prevImage = () => goToImage((imgIndex - 1 + images.length) % images.length)

  // ─── Swipe support (mobile, redesigned) ───────────────────────────
  const touchStartX = React.useRef(0)
  const touchStartY = React.useRef(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isSwiping, setIsSwiping] = useState(false)
  const containerWidthRef = React.useRef(1)
  const SWIPE_THRESHOLD = 40 // أقل مسافة أفقية (بالبكسل) عشان يتحسب swipe
  const DIRECTION_LOCK_THRESHOLD = 8

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    containerWidthRef.current = e.currentTarget.clientWidth || 1
    setIsDragging(true)
    setIsSwiping(false)
    setDragOffset(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const deltaX = e.touches[0].clientX - touchStartX.current
    const deltaY = e.touches[0].clientY - touchStartY.current

    if (!isSwiping) {
      if (Math.abs(deltaX) < DIRECTION_LOCK_THRESHOLD && Math.abs(deltaY) < DIRECTION_LOCK_THRESHOLD) return
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        setIsDragging(false)
        return
      }
      setIsSwiping(true)
    }

    const atStart = imgIndex === 0 && deltaX > 0
    const atEnd = imgIndex === images.length - 1 && deltaX < 0
    const eased = (atStart || atEnd) ? deltaX * 0.35 : deltaX
    setDragOffset(eased)
  }

  const handleTouchEnd = () => {
    if (isSwiping) {
      const effectiveThreshold = Math.min(containerWidthRef.current * 0.18, containerWidthRef.current * 0.4) || SWIPE_THRESHOLD
      if (dragOffset < -effectiveThreshold && dragOffset < -SWIPE_THRESHOLD) nextImage()
      else if (dragOffset > effectiveThreshold && dragOffset > SWIPE_THRESHOLD) prevImage()
    }
    setIsDragging(false)
    setIsSwiping(false)
    setDragOffset(0)
  }

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const inCartQuantity = items.find((i) => i.variantId === selectedVariant?.id)?.quantity ?? 0

  const handleAdd = () => {
    const item = buildCartItem()
    if (!item) return
    addItem(item)
    trackAddToCart({
      content_ids: [selectedVariant?.id || product.id],
      content_name: product.name,
      value: Number(product.price) * item.quantity,
      contents: [{ id: selectedVariant?.id || product.id, quantity: item.quantity, item_price: Number(product.price) }],
    })
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
      trackAddToCart({
        content_ids: [variant.id],
        content_name: product.name,
        value: Number(product.price) * toAdd,
        contents: [{ id: variant.id, quantity: toAdd, item_price: Number(product.price) }],
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
        .suggested-card:hover .suggested-img { transform: scale(1.04); opacity: 0.95 !important; }

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

        /* ── Out-of-stock diagonal strike — used for size buttons (product page + gift picker).
           A single line across the whole button reads instantly as "exists but sold out",
           unlike a faint/disabled look which reads as "not offered". */
        .size-btn-oos {
          position: relative;
        }
        .size-btn-oos::after {
          content: "";
          position: absolute;
          left: 8%;
          right: 8%;
          top: 50%;
          height: 1px;
          background: rgba(240,237,230,0.55);
          transform: translateY(-50%) rotate(-14deg);
          pointer-events: none;
        }

        /* ── Promo banner (top of product page) — compact, tag-style tiers ── */
        .promo-banner {
          border: 1px solid rgba(200,240,79,0.22);
          background: rgba(200,240,79,0.04);
          margin-bottom: 20px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .promo-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .promo-row-tier {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #080808;
          background: ${ACCENT};
          padding: 3px 7px;
          flex-shrink: 0;
          min-width: 52px;
          text-align: center;
        }
        .promo-row-divider {
          width: 1px;
          height: 14px;
          background: rgba(240,237,230,0.15);
          flex-shrink: 0;
        }
        .promo-row-title {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.03em;
          color: #f0ede6;
          white-space: nowrap;
        }
        .promo-row-sub {
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(240,237,230,0.35);
          padding-top: 6px;
          border-top: 1px solid rgba(240,237,230,0.06);
        }
        @media (max-width: 420px) {
          .promo-row-title { font-size: 10px; white-space: normal; }
        }

        /* ── Shipping info banner (top of product page) ── */
        .shipping-info-banner {
          border: 1px solid rgba(240,237,230,0.1);
          background: rgba(240,237,230,0.02);
          margin-bottom: 20px;
          padding: 14px 16px;
        }
        .shipping-info-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(240,237,230,0.55);
        }
        .shipping-info-row svg { flex-shrink: 0; opacity: 0.7; }
        .shipping-info-text {
          font-family: 'Space Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.02em;
          line-height: 1.5;
        }
        .shipping-info-text strong { color: #f0ede6; font-weight: 700; }

        /* ── Other colors banner (product page) ── */
        .other-colors-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          border: 1px solid rgba(240,237,230,0.1);
          background: rgba(240,237,230,0.02);
          margin-bottom: 20px;
          padding: 14px 16px;
        }
        .other-colors-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgb(249, 248, 245);
          white-space: nowrap;
        }
        .other-colors-swatches {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .other-colors-swatch-link {
          display: flex;
          align-items: center;
          gap: 7px;
          text-decoration: none;
          cursor: pointer;
        }
        .other-colors-swatch {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .other-colors-swatch-link:hover .other-colors-swatch {
          transform: scale(1.15);
          box-shadow: 0 0 0 3px rgba(240,237,230,0.1);
        }
        .other-colors-swatch-name {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(240,237,230,0.55);
          transition: color 0.15s ease;
        }
        .other-colors-swatch-link:hover .other-colors-swatch-name {
          color: #f0ede6;
        }

        /* ── Product info accordion ── */
        .info-accordion {
          margin-bottom: 28px;
          border-top: 1px solid rgba(240,237,230,0.08);
        }
        .info-accordion-item {
          border-bottom: 1px solid rgba(240,237,230,0.08);
        }
        .info-accordion-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: none;
          border: none;
          cursor: pointer;
          padding: 14px 0;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #f0ede6;
        }
        .info-accordion-icon {
          font-size: 14px;
          color: rgba(240,237,230,0.4);
          transition: transform 0.2s ease;
        }
        .info-accordion-body {
          padding: 0 0 18px;
          font-size: 11px;
          line-height: 1.9;
          color: rgba(240,237,230,0.5);
          letter-spacing: 0.02em;
          animation: slideDown 0.3s ease both;
        }

        /* ── Size chart / size recommendation link row ── */
        .size-tools-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .size-tool-link {
          display: flex; align-items: center; gap: 6px;
          font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
          color: #f0ede6; background: none;
          border: 1px solid rgba(240,237,230,0.3);
          padding: 6px 10px; cursor: pointer;
          font-family: 'Space Mono', monospace;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .size-tool-link.accent {
          border-color: rgba(200,240,79,0.4);
          color: ${ACCENT};
        }
        .size-tool-link.accent:hover {
          border-color: ${ACCENT};
        }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "70px 20px 80px" }}>

        <Link href="/products" style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", textDecoration: "none", marginBottom: "20px", display: "inline-block" }}>
          ← Back to Products
        </Link>

        <ShippingInfoBanner />
        <ActiveOfferBanner /> 
        <OtherColorsBanner currentColor={productColor} suggestedProducts={suggestedProducts} />
        <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px", marginTop: "24px" }}>

          <div
            style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", background: "#0d0d0d", touchAction: "pan-y" }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              style={{
                display: "flex",
                width: `${images.length * 100}%`,
                height: "100%",
                transform: `translateX(calc(${-imgIndex * (100 / images.length)}% + ${dragOffset}px))`,
                transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {images.map((src, i) => (
                <div key={src} style={{ width: `${100 / images.length}%`, height: "100%", flexShrink: 0 }}>
                  <img
                    src={optimizeCloudinaryUrl(src, 900)}
                    alt={product.name}
                    fetchPriority={i === 0 ? "high" : undefined}
                    draggable={false}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", userSelect: "none" }}
                  />
                </div>
              ))}
            </div>
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
              <div style={{
                position: "absolute", top: "16px", right: "16px",
                background: "rgba(8,8,8,0.75)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(240,237,230,0.2)",
                padding: "7px 14px",
              }}>
                <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.75)", margin: 0 }}>Sold Out</p>
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
                  <span style={{ fontSize: "16px", color: "rgba(240,237,230,0.5)", textDecoration: "line-through", fontFamily: "Cormorant Garamond, serif" }}>
                    {Number(product.originalPrice)}
                  </span>
                )}
                <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "32px", fontWeight: 300, color: "#f0ede6" }}>{Number(product.price)}</span>
                <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(240,237,230,0.6)" }}>EGP</span>
                {hasDiscount && (
                  <span className="sale-badge">
                    Sale
                  </span>
                )}
              </div>
            </div>

            <ProductInfoTabs />

            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.7)", margin: 0 }}>Size</p>
                <div className="size-tools-row">
                  <button
                    onClick={() => setSizeGuideTab("FINDER")}
                    className="size-tool-link accent"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    Size Recommendation
                  </button>
                  <button
                    onClick={() => setSizeGuideTab("CHART")}
                    className="size-tool-link"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="7" width="20" height="10" rx="1"/>
                      <path d="M6 7v3M10 7v5M14 7v3M18 7v5"/>
                    </svg>
                    Size Chart
                  </button>
                </div>
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
                      className={disabled ? "size-btn-oos" : ""}
                      onClick={() => { if (!disabled) { setSelectedSize(size); setQuantity(1) } }}
                      disabled={disabled}
                      title={disabled ? "Out of stock" : undefined}
                      style={{
                        flex: 1, padding: "14px 0", fontSize: "11px", fontFamily: "Space Mono, monospace",
                        letterSpacing: "0.1em", cursor: disabled ? "not-allowed" : "pointer",
                        background: isSelected ? "#f0ede6" : "transparent",
                        color: disabled ? "rgba(240,237,230,0.4)" : isSelected ? "#080808" : "#f0ede6",
                        border: isSelected ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.15)",
                        transition: "all 0.2s",
                      }}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
              {(() => {
                const outOfStockSizes = sizes.filter((size) => (variants.find((v) => v.size === size)?.stockQuantity ?? 0) === 0)
                if (outOfStockSizes.length === 0) return null
                return (
                  <p style={{ fontSize: "11px", letterSpacing: "0.03em", color: "rgba(240,237,230,0.85)", marginTop: "10px", marginBottom: 0 }}>
                    Out of stock: <span style={{ color: "#f0ede6", fontWeight: 700 }}>{outOfStockSizes.join(", ")}</span>
                  </p>
                )
              })()}
            </div>

            {selectedSize && isLowStock && !isSoldOut && (
              <p style={{ fontSize: "9px", letterSpacing: "0.1em", color: "rgba(220,120,80,0.85)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(220,120,80,0.85)", display: "inline-block", animation: "pulse 1.5s ease infinite" }} />
                Only {stockQuantity} left in stock
              </p>
            )}

            <div style={{ marginBottom: "28px" }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.7)", marginBottom: "12px" }}>Quantity</p>
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

            <BundleSection
              currentCartQuantity={currentCartQuantity}
              eligibleNow={eligibleNow}
              nextTier={nextTier}
              gifts={gifts}
              setGift={setGift}
              availableGiftVariants={availableGiftVariants}
              loadingGiftVariants={loadingGiftVariants}
            />

            <button
              onClick={handleAdd}
              disabled={quantityDisabled}
              style={{
                width: "100%", padding: "16px", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase",
                fontFamily: "Space Mono, monospace", cursor: quantityDisabled ? "not-allowed" : "pointer",
                background: added ? "rgba(100,200,150,0.9)" : isSoldOut ? "rgba(240,237,230,0.08)" : "#f0ede6",
                color: added ? "#080808" : isSoldOut ? "rgba(240,237,230,0.35)" : "#080808",
                border: !selectedSize && !isSoldOut ? "1px solid rgba(240,237,230,0.4)" : "none",
                opacity: !selectedSize && !isSoldOut ? 0.55 : 1,
                transition: "all 0.3s", marginBottom: "10px",
              }}
            >
              {added ? "✓ Added to Cart" : isSoldOut ? "Sold Out" : !selectedSize ? "Select a Size to Continue" : "Add to Cart"}
            </button>

            <button
              onClick={handleBuyNow}
              disabled={quantityDisabled || buying}
              style={{
                width: "100%", padding: "16px", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase",
                fontFamily: "Space Mono, monospace", cursor: (quantityDisabled || buying) ? "not-allowed" : "pointer",
                background: "transparent",
                color: isSoldOut ? "rgba(240,237,230,0.35)" : "#f0ede6",
                border: `1px solid ${isSoldOut ? "rgba(240,237,230,0.15)" : "rgba(240,237,230,0.5)"}`,
                opacity: (!selectedSize && !isSoldOut) ? 0.55 : 1,
                transition: "all 0.3s",
                marginBottom: "16px",
              }}
            >
              {buying ? "Redirecting…" : "Buy It Now"}
            </button>

          </div>

        </div>

        {suggestedProducts.length > 0 && (
          <div style={{ marginTop: "96px" }}>
            <div style={{ marginBottom: "28px", borderBottom: "1px solid rgba(240,237,230,0.06)", paddingBottom: "20px" }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)", marginBottom: "10px" }}>
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
                        alt={`${p.name} — ${colorLabel} oversized t-shirt`}
                        loading="lazy"
                        className="suggested-img"
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080808 0%, rgba(8,8,8,0.5) 20%, transparent 45%)" }} />
                      <div style={{ position: "absolute", bottom: "14px", left: "14px", right: "14px" }}>
                        <p className="suggested-name" style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 300, color: "#f0ede6", margin: "0 0 5px", lineHeight: 1.15 }}>
                          Oversize T-Shirt<br />
                          <span style={{ color: "rgba(240,237,230,0.75)" }}>— {colorLabel}</span>
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "7px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.6)" }}>
                            {colorLabel}
                          </span>
                          {hasDisc ? (
                            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                              <span className="suggested-orig" style={{ color: "rgba(240,237,230,0.45)", textDecoration: "line-through" }}>{p.originalPrice}</span>
                              <span className="suggested-price" style={{ color: "#f0ede6" }}>{p.price} EGP</span>
                            </span>
                          ) : (
                            <span className="suggested-price" style={{ color: "#f0ede6" }}>{p.price} EGP</span>
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

      {sizeGuideTab && (
        <SizeRecommendationModal
          open={!!sizeGuideTab}
          onClose={() => setSizeGuideTab(null)}
          initialTab={sizeGuideTab}
        />
      )}
    </div>
  )
}

const SWATCH_COLORS: Record<string, string> = {
  BLACK: "#1a1a1a",
  WHITE: "#f0ede6",
  GREY:  "#8a8a85",
  BEIGE: "#d8c8a8",
}

function BundleSection({
  currentCartQuantity,
  eligibleNow,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      {/* رسالة الحالة الحالية — دايمًا واضحة سواء لسه مفيش عرض اتحقق أو خد الهدية */}
      {upcomingTier ? (
        <p style={{ fontSize: "10px", letterSpacing: "0.05em", color: "rgba(240,237,230,0.6)", margin: 0 }}>
          🎁 Buy <span style={{ color: ACCENT }}>{upcomingTier.triggerQuantity}</span>, get <span style={{ color: ACCENT }}>1 free</span> — add <span style={{ color: ACCENT }}>{remaining}</span> more piece{remaining > 1 ? "s" : ""} to unlock it
        </p>
      ) : (
        <p style={{ fontSize: "10px", letterSpacing: "0.05em", color: ACCENT, margin: 0 }}>
          🎉 Offer unlocked — pick your free tee below
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
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "12px" }}>
                        <div className={isDone ? "check-pop" : ""} style={{
                          width: "15px", height: "15px", borderRadius: "50%", flexShrink: 0,
                          border: `1px solid ${isDone ? ACCENT : "rgba(240,237,230,0.25)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: isDone ? ACCENT : "transparent",
                        }}>
                          {isDone && <span style={{ fontSize: "9px", color: "#080808", lineHeight: 1 }}>✓</span>}
                        </div>
                        <p style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: isDone ? ACCENT : "#f0ede6", fontWeight: 700, margin: 0 }}>
                          {eligibleNow.freeQuantity > 1 ? `Your Free Gift ${idx + 1}` : "Your Free Gift"}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", paddingLeft: "22px", borderLeft: "1px solid rgba(240,237,230,0.08)" }}>
                        <div>
                          <p style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.9)", marginBottom: "7px" }}>
                            Color
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
                                  title={c.charAt(0) + c.slice(1).toLowerCase()}
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
                          {currentGift?.color && (
                            <p style={{ fontSize: "8px", color: ACCENT, marginTop: "7px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                              {currentGift.color.charAt(0) + currentGift.color.slice(1).toLowerCase()}
                            </p>
                          )}
                        </div>

                        <div>
                          <p style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.9)", marginBottom: "7px" }}>
                            Size
                          </p>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {giftSizes.map((s) => {
                              const colorPicked = !!currentGift?.color
                              const isOutOfStock = colorPicked && !sizeOptionsForColor.includes(s)
                              const isSelected = currentGift?.size === s
                              const disabled = !colorPicked || isOutOfStock
                              return (
                                <button
                                  key={s}
                                  className={`gift-size-btn ${isOutOfStock ? "size-btn-oos" : ""}`}
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
                                  }}
                                >
                                  {s}
                                </button>
                              )
                            })}
                          </div>
                          {!currentGift?.color && (
                            <p style={{ fontSize: "8px", color: "rgba(240,237,230,0.4)", marginTop: "7px", letterSpacing: "0.02em" }}>
                              Pick a color first
                            </p>
                          )}
                          {currentGift?.color && (() => {
                            const outOfStockSizes = giftSizes.filter((s) => !sizeOptionsForColor.includes(s))
                            if (outOfStockSizes.length === 0) return null
                            return (
                              <p style={{ fontSize: "10.5px", letterSpacing: "0.02em", color: "rgba(240,237,230,0.85)", marginTop: "8px" }}>
                                Out of stock: <span style={{ color: "#f0ede6", fontWeight: 700 }}>{outOfStockSizes.join(", ")}</span>
                              </p>
                            )
                          })()}
                        </div>
                      </div>

                      {isDone && (
                        <p style={{ fontSize: "8px", letterSpacing: "0.04em", color: ACCENT, marginTop: "10px", paddingLeft: "22px" }}>
                          ✓ Ready — added free to your order
                        </p>
                      )}
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
// Promo banner — DISABLED (kept for reference, not rendered anywhere).
// To bring back: swap <ShippingInfoBanner /> for <PromoBanner /> in the
// main component, and re-add ".promo-banner" styles if removed.
// ─────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PromoBanner() {
  return (
    <div className="promo-banner">
      <div className="promo-row">
        <span className="promo-row-tier">2 FOR 1</span>
        <span className="promo-row-divider" />
        <span className="promo-row-title">Buy 2, get 1 free</span>
      </div>
      <div className="promo-row">
        <span className="promo-row-tier">3 FOR 2</span>
        <span className="promo-row-divider" />
        <span className="promo-row-title">Buy 3, get 2 free</span>
      </div>
      <span className="promo-row-sub">Mix any colors & sizes · applied automatically at checkout</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Other colors banner — كل لون منتج منفصل في الداتابيز (مش variant واحد).
// الـ banner ده بيوضح للعميل إن اللون تاني = منتج تاني، ويدّيله طريقة سريعة
// يوصل بيها لصفحة اللون اللي عايزه من غير ما يدور تحت في "You Might Also Like".
// ─────────────────────────────────────────────────────────────────────────

const SWATCH_COLOR_HEX: Record<string, string> = {
  BLACK: "#1a1a1a",
  WHITE: "#f0ede6",
  GREY:  "#8a8a85",
  BEIGE: "#d8c8a8",
}

function OtherColorsBanner({
  currentColor,
  suggestedProducts,
}: {
  currentColor: string
  suggestedProducts: SuggestedProduct[]
}) {
  // نفس المنتج (Oversize T-Shirt) بألوان تانية بس — suggestedProducts أصلاً مفلترة من السيرفر (mysweatpants
  // مستبعدة في getSuggestedProducts)، فاللي تاني بس هو استبعاد نفس اللون الحالي
  const otherColorProducts = suggestedProducts.filter(
    (p) => (p.variants?.[0]?.color || "BLACK") !== currentColor
  )

  if (otherColorProducts.length === 0) return null

  return (
    <div className="other-colors-banner">
      <span className="other-colors-label">Also available in</span>
      <div className="other-colors-swatches">
        {otherColorProducts.map((p) => {
          const color = p.variants?.[0]?.color || "BLACK"
          const colorLabel = color.charAt(0) + color.slice(1).toLowerCase()
          return (
            <Link
              href={`/products/${p.id}`}
              key={p.id}
              className="other-colors-swatch-link"
              aria-label={`View ${colorLabel} colorway`}
              title={colorLabel}
            >
              <span
                className="other-colors-swatch"
                style={{
                  background: SWATCH_COLOR_HEX[color],
                  border: color === "WHITE" ? "1px solid rgba(240,237,230,0.3)" : "1px solid rgba(240,237,230,0.15)",
                }}
              />
              <span className="other-colors-swatch-name">{colorLabel}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Shipping info banner — replaces the promo banner at top of product page
// ─────────────────────────────────────────────────────────────────────────

function ShippingInfoBanner() {
  return (
    <div className="shipping-info-banner">
      <div className="shipping-info-row">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="6" width="14" height="11"/><path d="M15 9h4l3 3v5h-7z"/><circle cx="6" cy="19" r="2"/><circle cx="17.5" cy="19" r="2"/>
        </svg>
        <span className="shipping-info-text">Estimated delivery: <strong> 2-5 business days</strong></span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Product info accordion — Description / Shipping & Returns / Return Policies
// ─────────────────────────────────────────────────────────────────────────

function ProductInfoTabs() {
  const [openSection, setOpenSection] = useState<string | null>(null)

  const toggle = (key: string) => setOpenSection((prev) => (prev === key ? null : key))

  const sections = [
    {
      key: "description",
      title: "Description",
      content: (
        <>
          <strong>Material:</strong> 100% Premium Interlock Cotton<br />
          <strong>Fit:</strong> Relaxed Oversized Boxy Fit<br />
          <strong>Construction:</strong> Double-Sided Interlock Fabric<br />
          <strong>Designed &amp; Made in:</strong> Cairo, Egypt
        </>
      ),
    },
    {
      key: "shipping",
      title: "Shipping and Returns",
      content: (
        <>
          shiping all over Egypt. Orders are processed within 24 hours and delivered within 2-5 business days. Delivery estimates may vary due to holidays, weather, or courier delays.
          <br /><br />
          To be eligible for a return or exchange, items must be unused, unwashed, and with all original tags attached. Manufacturing defects or incorrectly shipped items are handled entirely at 2Z&apos;s expense.
        </>
      ),
    },
    {
      key: "returns",
      title: "Return Policies",
      content: (
        <>
          You retain all rights granted under the Egyptian Consumer Protection Law. Returns and exchanges are accepted on unused, unwashed items with original tags attached.
          <br /><br />
          If an item arrives defective or incorrect, contact us at <strong>2z.eg2004@gmail.com</strong> and we&apos;ll handle the return at our own expense after verification.
        </>
      ),
    },
  ]

  return (
    <div className="info-accordion">
      {sections.map((s) => {
        const isOpen = openSection === s.key
        return (
          <div key={s.key} className="info-accordion-item">
            <button className="info-accordion-header" onClick={() => toggle(s.key)}>
              <span>{s.title}</span>
              <span className={`info-accordion-icon ${isOpen ? "open" : ""}`}>{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div className="info-accordion-body">
                {s.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}