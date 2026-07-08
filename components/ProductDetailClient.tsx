"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/lib/store/cart"

const colorImages: Record<string, string[]> = {
  BLACK: [
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-black.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-black-2.jpg",
  ],
  WHITE: [
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-white.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-white-2.jpg",
  ],
  GREY: [
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-grey.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-grey-2.jpg",
  ],
  BEIGE: [
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-beige.jpg",
    "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-beige-2.jpg",
  ],
}

const SIZE_CHART_IMAGE = "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/size-chart.jpg"

const sizes = ["M", "L", "XL"]
const LOW_STOCK_THRESHOLD = 3

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
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  const [sizeChartOpen, setSizeChartOpen] = useState(false)
  const [buying, setBuying] = useState(false)
  const { addItem, items } = useCart()
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

  const goToImage = (index: number) => {
    setImgLoaded(false)
    setImgIndex(index)
  }

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
    if (buying) return // منع الدوسة المزدوجة
    const variant = variants.find((v) => v.size === selectedSize)
    if (!variant || variant.stockQuantity === 0) return

    // لو الكمية المطلوبة أكبر من اللي موجود بالفعل في الكارت لنفس الـ variant،
    // نضيف بس الفرق. لو هو أصلاً حاطط كل الكمية دي في الكارت قبل كده، منضيفش حاجة تانية.
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

        .suggested-name  { font-size: 14px; }
        .suggested-price { font-size: 12px; }
        .suggested-orig  { font-size: 10px; }
        @media (min-width: 640px) {
          .suggested-name  { font-size: 17px; }
          .suggested-price { font-size: 13px; }
          .suggested-orig  { font-size: 11px; }
        }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "70px 20px 80px" }}>

        <Link href="/products" style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", textDecoration: "none", marginBottom: "32px", display: "inline-block" }}>
          ← Back to Products
        </Link>

        <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px", marginTop: "24px" }}>

          <div style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", background: "#0d0d0d" }}>
            <img
              src={img}
              alt={product.name}
              onLoad={() => setImgLoaded(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: imgLoaded ? 0.9 : 0, transition: "opacity 0.5s ease", display: "block" }}
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
                  <span style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", border: "1px solid #c8f04f", color: "#c8f04f", padding: "4px 9px" }}>
                    First Drop
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
              }}
            >
              {buying ? "Redirecting…" : "Buy It Now"}
            </button>
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
                      <img
                        src={productImgs[0]}
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
              src={SIZE_CHART_IMAGE}
              alt="Size Chart"
              style={{ width: "100%", height: "auto", display: "block", border: "1px solid rgba(240,237,230,0.1)" }}
            />
          </div>
        </div>
      )}
    </div>
  )
}