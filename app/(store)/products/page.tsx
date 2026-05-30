"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { SkeletonCard } from "@/components/Skeleton"

const categoryImages: Record<string, string> = {
  "t-shirts": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=50&fm=webp",
  "sweatpants": "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=50&fm=webp",
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState("all")

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => { setProducts(data.products || data); setLoading(false) })
  }, [])

  const filtered = active === "all"
    ? products
    : products.filter((p) => p.category?.slug === active)

  return (
    <div style={{ background: "var(--bg)", color: "var(--fg)", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .product-card { animation: fadeUp 0.6s ease both; }
        .card-img { transition: opacity 0.5s, transform 0.7s; }
        .product-card:hover .card-img { opacity: 0.9 !important; transform: scale(1.05); }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "70px 20px 60px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "6px" }}>Browse</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "var(--fg)", marginBottom: "32px" }}>All Products</h1>

        <div style={{ display: "flex", gap: "16px", marginBottom: "40px", flexWrap: "wrap" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          {loading ? (
            [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
          ) : (
            filtered.map((p, i) => (
              <Link
                href={`/products/${p.id}`}
                key={p.id}
                className="product-card"
                style={{ textDecoration: "none", animationDelay: `${i * 80}ms` }}
              >
                <div style={{ aspectRatio: "3/4", overflow: "hidden", background: "var(--card)", marginBottom: "10px", position: "relative" }}>
                  <img
                    src={categoryImages[p.category?.slug] || categoryImages["t-shirts"]}
                    alt={p.name}
                    loading="lazy"
                    className="card-img"
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
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
              </Link>
            ))
          )}
        </div>

      </div>
    </div>
  )
}