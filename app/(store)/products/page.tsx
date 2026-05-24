"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const categoryImages: Record<string, string> = {
  "t-shirts": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=60",
  "sweatpants": "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=60",
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState("all")

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false) })
  }, [])

  const filtered = active === "all"
    ? products
    : products.filter((p) => p.category?.slug === active)

  return (
    <div style={{ background: "var(--bg)", color: "var(--fg)", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "70px 20px 60px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "6px" }}>Browse</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "var(--fg)", marginBottom: "32px" }}>All Products</h1>

        {/* Filters */}
        <div style={{ display: "flex", gap: "24px", marginBottom: "40px" }}>
          {["all", "t-shirts", "sweatpants"].map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              style={{
                fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "Space Mono, monospace",
                color: active === f ? "var(--fg)" : "var(--fg-muted)",
                borderBottom: active === f ? "1px solid var(--fg)" : "1px solid transparent",
                paddingBottom: "4px", transition: "all 0.3s",
              }}
            >
              {f === "all" ? "All" : f === "t-shirts" ? "T-Shirts" : "Sweatpants"}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--fg-muted)" }}>Loading...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            {filtered.map((p) => (
              <Link href={`/products/${p.id}`} key={p.id} style={{ textDecoration: "none" }}>
                <div style={{ cursor: "pointer" }}>
                  <div style={{ aspectRatio: "3/4", overflow: "hidden", background: "var(--card)", marginBottom: "10px", position: "relative" }}>
                    <img
                      src={categoryImages[p.category?.slug] || categoryImages["t-shirts"]}
                      alt={p.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7, transition: "opacity 0.5s, transform 0.7s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0.9"; (e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0.7"; (e.currentTarget as HTMLImageElement).style.transform = "scale(1)" }}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--bg) 0%, transparent 50%)" }} />
                    <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px" }}>
                      <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "16px", fontWeight: 300, color: "var(--fg)", marginBottom: "4px" }}>{p.name}</p>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--fg-muted)" }}>{p.category?.name}</span>
                        <span style={{ fontSize: "9px", color: "var(--fg-muted)" }}>{Number(p.price)} EGP</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}