"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { SkeletonCard } from "@/components/Skeleton"

const categoryImages: Record<string, string> = {
  "t-shirts": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=70&fm=webp",
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        const all = data.products || data
        setProducts(all.filter((p: any) => p.category?.slug !== "sweatpants"))
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .p-card { animation: fadeUp 0.5s ease both; text-decoration: none; display: block; }
        .p-img  { transition: transform 0.7s ease, opacity 0.5s ease; }
        .p-card:hover .p-img { transform: scale(1.04); opacity: 0.75 !important; }
        .p-card:hover .p-name { color: rgba(240,237,230,0.7) !important; }

        @media (min-width: 640px)  { .p-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (min-width: 1024px) { .p-grid { grid-template-columns: repeat(4, 1fr) !important; } }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 20px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: "56px", borderBottom: "1px solid rgba(240,237,230,0.06)", paddingBottom: "40px" }}>
          <p style={{
            fontSize: "9px", letterSpacing: "0.35em", textTransform: "uppercase",
            color: "rgba(240,237,230,0.3)", marginBottom: "14px",
          }}>
            Collection — SS 26
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
            <h1 style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "clamp(36px, 6vw, 64px)",
              fontWeight: 300, lineHeight: 1,
              color: "#f0ede6", margin: 0,
            }}>
              Essential<br />
              <em style={{ color: "rgba(240,237,230,0.35)", fontStyle: "italic" }}>Tees</em>
            </h1>
            <p style={{
              fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase",
              color: "rgba(240,237,230,0.3)", lineHeight: 2, margin: 0,
            }}>
              Black · White · Grey · Beige<br />
              550 EGP
            </p>
          </div>
        </div>

        {/* Count */}
        {!loading && (
          <p style={{
            fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase",
            color: "rgba(240,237,230,0.25)", marginBottom: "24px",
          }}>
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        )}

        {/* Grid */}
        <div
          className="p-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2px" }}
        >
          {loading ? (
            [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
          ) : (
            products.map((p, i) => (
              <Link
                href={`/products/${p.id}`}
                key={p.id}
                className="p-card"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Image */}
                <div style={{ aspectRatio: "3/4", overflow: "hidden", background: "#111", position: "relative" }}>
                  <img
                    src={categoryImages[p.category?.slug] || categoryImages["t-shirts"]}
                    alt={p.name}
                    loading="lazy"
                    className="p-img"
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.65 }}
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, #080808 0%, transparent 55%)",
                  }} />

                  {/* Overlay info */}
                  <div style={{ position: "absolute", bottom: "16px", left: "16px", right: "16px" }}>
                    <p
                      className="p-name"
                      style={{
                        fontFamily: "Cormorant Garamond, serif",
                        fontSize: "20px", fontWeight: 300,
                        color: "#f0ede6", margin: "0 0 6px",
                        transition: "color 0.3s",
                      }}
                    >
                      {p.name}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{
                        fontSize: "8px", letterSpacing: "0.2em",
                        textTransform: "uppercase", color: "rgba(240,237,230,0.4)",
                      }}>
                        {p.category?.name}
                      </span>
                      {p.originalPrice && Number(p.originalPrice) > Number(p.price) ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "8px", color: "rgba(240,237,230,0.3)", textDecoration: "line-through" }}>
                            {Number(p.originalPrice)}
                          </span>
                          <span style={{ fontSize: "9px", color: "rgba(240,237,230,0.7)" }}>
                            {Number(p.price)} EGP
                          </span>
                        </span>
                      ) : (
                        <span style={{ fontSize: "9px", color: "rgba(240,237,230,0.5)" }}>
                          {Number(p.price)} EGP
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Empty */}
        {!loading && products.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.2)" }}>
              No products found
            </p>
          </div>
        )}

      </div>
    </div>
  )
}