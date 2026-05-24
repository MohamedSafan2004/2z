"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useCart } from "@/lib/store/cart"
import { useRouter } from "next/navigation"

const categoryImages: Record<string, string> = {
  "t-shirts": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
  "sweatpants": "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=80",
}

const sizes = ["S", "M", "L"]

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [product, setProduct] = useState<any>(null)
  const [variants, setVariants] = useState<any[]>([])
  const [selectedSize, setSelectedSize] = useState("")
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(true)
  const { addItem, items } = useCart()
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => { setProduct(data); setVariants(data.variants || []); setLoading(false) })
  }, [id])

  if (loading) return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--fg-muted)" }}>Loading...</p>
    </div>
  )

  if (!product || product.error) return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: "11px", color: "var(--fg)" }}>Product not found</p>
    </div>
  )

  const handleAdd = () => {
    const variant = variants.find((v) => v.size === selectedSize && v.productId === product.id)
    if (!variant) return
    addItem({
      variantId: variant.id,
      productName: product.name,
      price: Number(product.price),
      color: variant.color,
      size: variant.size,
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const img = categoryImages[product.category?.slug] || categoryImages["t-shirts"]

  return (
    <div style={{ background: "var(--bg)", color: "var(--fg)", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "70px 20px 60px" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--fg-muted)", marginBottom: "24px", textTransform: "uppercase", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "var(--fg-muted)", textDecoration: "none" }}>Home</Link>
          <span>/</span>
          <Link href="/products" style={{ color: "var(--fg-muted)", textDecoration: "none" }}>Shop</Link>
          <span>/</span>
          <span style={{ color: "var(--fg)" }}>{product.name}</span>
        </div>

        {/* Layout — stack on mobile, side by side on desktop */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
          <style>{`@media (min-width: 768px) { .product-grid { grid-template-columns: 1fr 1fr !important; gap: 56px !important; } }`}</style>

          <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>

            {/* Image */}
            <div style={{ aspectRatio: "4/5", overflow: "hidden", background: "var(--card)", position: "relative" }}>
              <img src={img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
            </div>

            {/* Info */}
            <div>
              <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "8px" }}>{product.category?.name}</p>
              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "32px", fontWeight: 300, lineHeight: 1.1, marginBottom: "6px", color: "var(--fg)" }}>{product.name}</h1>
              <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "24px", color: "var(--fg)", marginBottom: "20px" }}>
                {Number(product.price)} <span style={{ fontSize: "11px", color: "var(--fg-muted)" }}>EGP</span>
              </p>

              <div style={{ borderTop: "1px solid var(--border)", margin: "0 0 16px" }} />

              <p style={{ fontSize: "11px", lineHeight: 2, color: "var(--fg-muted)", marginBottom: "20px" }}>{product.description}</p>

              <div style={{ borderTop: "1px solid var(--border)", margin: "0 0 16px" }} />

              <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "12px" }}>Size</p>
              <div style={{ display: "flex", gap: "0", marginBottom: "20px" }}>
                {sizes.map((s) => {
                  const variant = variants.find((v) => v.size === s)
                  const outOfStock = !variant || variant.stockQuantity === 0
                  return (
                    <button
                      key={s}
                      onClick={() => !outOfStock && setSelectedSize(s)}
                      style={{
                        flex: 1, height: "44px", fontSize: "10px", letterSpacing: "0.1em",
                        border: selectedSize === s ? "1px solid var(--fg)" : "1px solid var(--border)",
                        color: outOfStock ? "var(--fg-dim)" : selectedSize === s ? "var(--fg)" : "var(--fg-muted)",
                        background: selectedSize === s ? "rgba(240,237,230,0.05)" : "none",
                        cursor: outOfStock ? "not-allowed" : "pointer",
                        fontFamily: "Space Mono, monospace",
                        transition: "all 0.2s",
                        textDecoration: outOfStock ? "line-through" : "none",
                      }}
                    >{s}</button>
                  )
                })}
              </div>

              <button
                onClick={handleAdd}
                disabled={!selectedSize}
                style={{
                  width: "100%", padding: "15px", fontSize: "11px", letterSpacing: "0.25em",
                  textTransform: "uppercase", fontFamily: "Space Mono, monospace",
                  background: selectedSize ? "var(--fg)" : "transparent",
                  color: selectedSize ? "var(--bg)" : "var(--fg-dim)",
                  border: selectedSize ? "1px solid var(--fg)" : "1px solid var(--border)",
                  cursor: selectedSize ? "pointer" : "not-allowed", transition: "all 0.3s",
                }}
              >
                {added ? "Added to Cart ✓" : selectedSize ? "Add to Cart" : "Select a Size First"}
              </button>
              <button
                onClick={() => {
                  const variant = variants.find((v) => v.size === selectedSize && v.productId === product.id)
                  if (!variant) return
                  const existingItem = items.find((i: any) => i.variantId === variant.id)
                  if (!existingItem) {
                    handleAdd()
                  }
                  setTimeout(() => router.push("/checkout"), 100)
                }}
                disabled={!selectedSize}
                style={{
                  width: "100%",
                  padding: "15px",
                  fontSize: "11px",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  fontFamily: "Space Mono, monospace",
                  background: "transparent",
                  color: selectedSize ? "#f0ede6" : "rgba(240,237,230,0.25)",
                  border: selectedSize ? "1px solid rgba(240,237,230,0.4)" : "1px solid rgba(240,237,230,0.15)",
                  cursor: selectedSize ? "pointer" : "not-allowed",
                  transition: "all 0.3s",
                  marginTop: "10px",
                }}
              >
                Buy it Now
              </button>
            </div>
          </div>
        </div>

        {/* More Products */}
        <div style={{ marginTop: "60px", borderTop: "1px solid var(--border)", paddingTop: "40px" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "24px", textAlign: "center" }}>More from 2Z</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <Link href="/products" key={i} style={{ textDecoration: "none" }}>
                <div style={{ aspectRatio: "3/4", overflow: "hidden", background: "var(--card)", marginBottom: "8px" }}>
                  <img
                    src={img}
                    alt="product"
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6, transition: "opacity 0.5s, transform 0.7s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0.9"; (e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0.6"; (e.currentTarget as HTMLImageElement).style.transform = "scale(1)" }}
                  />
                </div>
                <p style={{ fontSize: "11px", fontFamily: "Cormorant Garamond, serif", color: "var(--fg)" }}>{product.name}</p>
                <p style={{ fontSize: "9px", color: "var(--fg-muted)", marginTop: "2px" }}>{Number(product.price)} EGP</p>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}