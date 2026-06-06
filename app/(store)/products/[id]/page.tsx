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

const sizes = ["S", "M", "L"]
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

  const handleBuyNow = () => {
    const variant = variants.find((v) => v.size === selectedSize)
    if (!variant || variant.stockQuantity === 0) return
    const existingItem = items.find((i: any) => i.variantId === variant.id)
    if (!existingItem) handleAdd()
    setTimeout(() => router.push("/checkout"), 100)
  }

  const img = categoryImages[product.category?.slug] || categoryImages["t-shirts"]

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <style>{`
        @media (min-width: 768px) {
          .product-grid { grid-template-columns: 1fr 1fr !important; gap: 64px !important; }
          .more-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 32px !important; }
        }
        .size-btn:hover { border-color: rgba(240,237,230,0.6) !important; }
        .add-btn:hover { opacity: 0.85 !important; }
        @keyframes lowStockPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .low-stock-badge { animation: lowStockPulse 2s ease infinite; }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "70px 20px 80px" }}>

        <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "rgba(240,237,230,0.3)", marginBottom: "32px", textTransform: "uppercase", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/" style={{ color: "rgba(240,237,230,0.3)", textDecoration: "none" }}>Home</Link>
          <span style={{ opacity: 0.3 }}>/</span>
          <Link href="/products" style={{ color: "rgba(240,237,230,0.3)", textDecoration: "none" }}>Shop</Link>
          <span style={{ opacity: 0.3 }}>/</span>
          <span style={{ color: "#f0ede6" }}>{product.name}</span>
        </div>

        <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px" }}>

          {/* Image */}
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
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "32px", fontWeight: 300, color: "#f0ede6" }}>{Number(product.price)}</span>
                <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(240,237,230,0.4)" }}>EGP</span>
              </div>
            </div>

            <div style={{ height: "1px", background: "rgba(240,237,230,0.06)", marginBottom: "28px" }} />

            {product.description && (
              <p style={{ fontSize: "11px", lineHeight: 2, color: "rgba(240,237,230,0.5)", marginBottom: "28px", letterSpacing: "0.05em" }}>
                {product.description}
              </p>
            )}

            {/* Size */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)" }}>Size</p>
                {selectedSize && (
                  isSoldOut ? (
                    <p style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(220,60,60,1)", fontWeight: 400 }}>
                      Sold Out
                    </p>
                  ) : isLowStock ? (
                    <p className="low-stock-badge" style={{ fontSize: "12px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(220,60,60,0.9)" }}>
                      Only {stockQuantity} left!
                    </p>
                  ) : (
                    <p style={{ fontSize: "9px", letterSpacing: "0.15em", color: "rgba(240,237,230,0.35)" }}>
                      {stockQuantity} in stock
                    </p>
                  )
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {sizes.map((s) => {
                  const variant    = variants.find((v) => v.size === s)
                  const outOfStock = !variant || variant.stockQuantity === 0
                  const lowStock   = variant && variant.stockQuantity > 0 && variant.stockQuantity <= LOW_STOCK_THRESHOLD
                  const isSelected = selectedSize === s
                  return (
                    <button key={s} className="size-btn"
                      onClick={() => { if (!outOfStock) { setSelectedSize(s); setQuantity(1) } }}
                      style={{
                        flex: 1, height: "48px", fontSize: "11px", letterSpacing: "0.15em",
                        border: isSelected
                          ? "1px solid #f0ede6"
                          : lowStock
                          ? "1px solid rgba(220,60,60,0.4)"
                          : "1px solid rgba(240,237,230,0.12)",
                        color: outOfStock
                          ? "rgba(240,237,230,0.15)"
                          : isSelected
                          ? "#f0ede6"
                          : lowStock
                          ? "rgba(220,80,80,0.8)"
                          : "rgba(240,237,230,0.5)",
                        background: isSelected ? "rgba(240,237,230,0.06)" : "transparent",
                        cursor: outOfStock ? "not-allowed" : "pointer",
                        fontFamily: "Space Mono, monospace",
                        transition: "all 0.2s",
                        textDecoration: outOfStock ? "line-through" : "none",
                      }}
                    >{s}</button>
                  )
                })}
              </div>
            </div>

            {/* Quantity — مش شغال غير بعد اختيار السايز */}
            <div style={{ marginBottom: "28px" }}>
              <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: quantityDisabled ? "rgba(240,237,230,0.2)" : "rgba(240,237,230,0.4)", marginBottom: "12px", transition: "color 0.2s" }}>Quantity</p>
              <div style={{ display: "flex", alignItems: "center", width: "fit-content", border: `1px solid ${quantityDisabled ? "rgba(240,237,230,0.06)" : "rgba(240,237,230,0.12)"}`, opacity: quantityDisabled ? 0.4 : 1, transition: "all 0.2s" }}>
                <button
                  onClick={() => !quantityDisabled && setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantityDisabled || quantity === 1}
                  style={{ width: "44px", height: "44px", background: "transparent", border: "none", color: quantityDisabled || quantity === 1 ? "rgba(240,237,230,0.2)" : "rgba(240,237,230,0.7)", cursor: quantityDisabled || quantity === 1 ? "not-allowed" : "pointer", fontSize: "18px", fontFamily: "Space Mono, monospace", transition: "color 0.2s" }}
                >−</button>
                <span style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#f0ede6", borderLeft: "1px solid rgba(240,237,230,0.12)", borderRight: "1px solid rgba(240,237,230,0.12)" }}>{quantity}</span>
                <button
                  onClick={() => !quantityDisabled && setQuantity(q => Math.min(maxStock, q + 1))}
                  disabled={quantityDisabled || quantity === maxStock}
                  style={{ width: "44px", height: "44px", background: "transparent", border: "none", color: quantityDisabled || quantity === maxStock ? "rgba(240,237,230,0.2)" : "rgba(240,237,230,0.7)", cursor: quantityDisabled || quantity === maxStock ? "not-allowed" : "pointer", fontSize: "18px", fontFamily: "Space Mono, monospace", transition: "color 0.2s" }}
                >+</button>
              </div>
            </div>

            <div style={{ height: "1px", background: "rgba(240,237,230,0.06)", marginBottom: "28px" }} />

            {/* Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {isSoldOut ? (
                <>
                  <div style={{ width: "100%", padding: "16px", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", color: "rgba(220,60,60,0.5)", border: "1px solid rgba(220,60,60,0.15)", textAlign: "center" }}>
                    Sold Out
                  </div>
                  <div style={{ width: "100%", padding: "16px", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", color: "rgba(240,237,230,0.15)", border: "1px solid rgba(240,237,230,0.06)", textAlign: "center" }}>
                    Sold Out
                  </div>
                </>
              ) : (
                <>
                  <button className="add-btn" onClick={handleAdd} disabled={!selectedSize}
                    style={{ width: "100%", padding: "16px", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", background: selectedSize ? "#f0ede6" : "transparent", color: selectedSize ? "#080808" : "rgba(240,237,230,0.2)", border: selectedSize ? "none" : "1px solid rgba(240,237,230,0.1)", cursor: selectedSize ? "pointer" : "not-allowed", transition: "all 0.3s" }}>
                    {added ? "✓ Added to Cart" : selectedSize ? "Add to Cart" : "Select a Size"}
                  </button>
                  <button onClick={handleBuyNow} disabled={!selectedSize}
                    style={{ width: "100%", padding: "16px", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", background: "transparent", color: selectedSize ? "rgba(240,237,230,0.8)" : "rgba(240,237,230,0.15)", border: selectedSize ? "1px solid rgba(240,237,230,0.25)" : "1px solid rgba(240,237,230,0.08)", cursor: selectedSize ? "pointer" : "not-allowed", transition: "all 0.3s" }}>
                    Buy it Now
                  </button>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: "24px", marginTop: "28px" }}>
              {["Free returns", "Egypt only", "Fast delivery"].map((t) => (
                <p key={t} style={{ fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgb(240, 237, 230)" }}>{t}</p>
              ))}
            </div>
          </div>
        </div>

        {/* More from 2Z */}
        <div style={{ marginTop: "80px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
            <div style={{ height: "1px", flex: 1, background: "rgba(240,237,230,0.06)" }} />
            <p style={{ fontSize: "9px", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", whiteSpace: "nowrap" }}>More from 2Z</p>
            <div style={{ height: "1px", flex: 1, background: "rgba(240,237,230,0.06)" }} />
          </div>
          <div className="more-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
            {[
              { slug: "t-shirts", name: "Essential Tee", price: 350 },
              { slug: "sweatpants", name: "Sweatpants", price: 650 },
              { slug: "t-shirts", name: "Essential Tee", price: 350 },
            ].map((item, i) => (
              <Link href="/products" key={i} style={{ textDecoration: "none" }}>
                <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", background: "#0d0d0d", marginBottom: "12px" }}>
                  <img src={categoryImages[item.slug]} alt={item.name} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55, transition: "opacity 0.6s, transform 0.8s" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLImageElement; el.style.opacity = "0.8"; el.style.transform = "scale(1.04)" }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLImageElement; el.style.opacity = "0.55"; el.style.transform = "scale(1)" }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080808 0%, transparent 60%)" }} />
                  <div style={{ position: "absolute", bottom: "14px", left: "14px", right: "14px" }}>
                    <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "18px", fontWeight: 300, color: "#f0ede6", marginBottom: "4px" }}>{item.name}</p>
                    <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.4)" }}>{item.price} EGP</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}