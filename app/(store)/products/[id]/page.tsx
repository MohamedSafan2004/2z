"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useCart } from "@/lib/store/cart"
import { useRouter } from "next/navigation"
import { SkeletonBlock, SkeletonLine } from "@/components/Skeleton"

const categoryImages: Record<string, string> = {
  "t-shirts": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=50&fm=webp",
  "sweatpants": "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=50&fm=webp",
}

const sizes = ["M", "L", "XL"]
const LOW_STOCK_THRESHOLD = 3

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [product, setProduct] = useState<any>(null)
  const [variants, setVariants] = useState<any[]>([])
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [imgLoaded, setImgLoaded] = useState(false)
  const { addItem, items } = useCart()
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => { setProduct(data); setVariants(data.variants || []); setLoading(false) })
  }, [id])

  if (loading) return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <style>{`@media (min-width: 768px) { .product-grid { grid-template-columns: 1fr 1fr !important; gap: 64px !important; } }`}</style>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "70px 20px 80px" }}>
        <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px" }}>
          <SkeletonBlock height="500px" />
          <div>
            <SkeletonLine width="30%" height="10px" />
            <SkeletonLine width="60%" height="48px" />
            <SkeletonLine width="25%" height="32px" />
            <div style={{ height: "1px", background: "rgba(240,237,230,0.06)", margin: "28px 0" }} />
            <SkeletonLine width="100%" height="12px" />
            <SkeletonLine width="90%" height="12px" />
            <SkeletonLine width="70%" height="12px" />
            <div style={{ height: "1px", background: "rgba(240,237,230,0.06)", margin: "28px 0" }} />
            <SkeletonLine width="20%" height="10px" />
            <div style={{ display: "flex", gap: "8px", marginTop: "12px", marginBottom: "28px" }}>
              {[1, 2, 3].map((i) => <SkeletonBlock key={i} height="48px" />)}
            </div>
            <SkeletonBlock height="52px" />
            <div style={{ marginTop: "10px" }}><SkeletonBlock height="52px" /></div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!product || product.error) return (
    <div style={{ background: "#080808", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: "11px", color: "#f0ede6" }}>Product not found</p>
    </div>
  )

  const selectedVariant = variants.find((v) => v.size === selectedSize)
  const stockQuantity   = selectedVariant?.stockQuantity ?? 0
  const maxStock        = stockQuantity
  const isSoldOut       = selectedSize ? stockQuantity === 0 : false
  const isLowStock      = selectedSize ? stockQuantity > 0 && stockQuantity <= LOW_STOCK_THRESHOLD : false
  const quantityDisabled = !selectedSize || isSoldOut
  const hasDiscount     = product.originalPrice && Number(product.originalPrice) > Number(product.price)

  const img = categoryImages[product.category?.slug] || categoryImages["t-shirts"]

  const handleAdd = () => {
    const variant = variants.find((v) => v.size === selectedSize)
    if (!variant || variant.stockQuantity === 0) return
    addItem({
      variantId: variant.id,
      productName: product.name,
      price: Number(product.price),
      color: variant.color,
      size: variant.size,
      quantity,
      imageUrl: img,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const inCartQuantity = items.find((i) => i.variantId === selectedVariant?.id)?.quantity ?? 0
  const availableToAdd = maxStock - inCartQuantity

  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <style>{`@media (min-width: 768px) { .product-grid { grid-template-columns: 1fr 1fr !important; gap: 64px !important; } }`}</style>
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
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: imgLoaded ? 0.9 : 0, transition: "opacity 0.8s ease", display: "block" }}
            />
            <div style={{ position: "absolute", top: "16px", left: "16px", background: "rgba(8,8,8,0.7)", backdropFilter: "blur(8px)", padding: "6px 12px" }}>
              <span style={{ fontSize: "8px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.6)" }}>{product.category?.name}</span>
            </div>
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
              <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.5)", marginBottom: "12px" }}>Size</p>
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

            <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>

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
                border: "none", transition: "all 0.3s",
              }}
            >
              {added ? "✓ Added to Cart" : isSoldOut ? "Sold Out" : !selectedSize ? "Select a Size" : "Add to Cart"}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}