"use client"

import Link from "next/link"
import React, { useEffect, useRef, useState } from "react"

const colorImages: Record<string, string> = {
  BLACK: "https://res.cloudinary.com/ghetnovd/image/upload/v1782992648/2z-store/tee-black.jpg",
  WHITE: "https://res.cloudinary.com/ghetnovd/image/upload/v1782992648/2z-store/tee-white.jpg",
  GREY:  "https://res.cloudinary.com/ghetnovd/image/upload/v1782992649/2z-store/tee-grey.jpg",
  BEIGE: "https://res.cloudinary.com/ghetnovd/image/upload/v1782992650/2z-store/tee-beige.jpg",
}

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = "0"
    el.style.transform = "translateY(28px)"
    el.style.transition = `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1"
          el.style.transform = "translateY(0)"
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])
  return <div ref={ref}>{children}</div>
}

export default function Home() {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/products?limit=2")
      .then((r) => r.json())
      .then((data) => {
        const all = data.products || data
        setProducts(all.slice(0, 2))
      })
      .catch(() => setProducts([]))
  }, [])

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1;   }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes scrollLine {
          0%   { transform: scaleY(0); transform-origin: top;    }
          50%  { transform: scaleY(1); transform-origin: top;    }
          51%  { transform: scaleY(1); transform-origin: bottom; }
          100% { transform: scaleY(0); transform-origin: bottom; }
        }

        .hero-tag   { animation: fadeUp  0.8s ease 0.2s both; }
        .hero-title { animation: fadeUp  1.0s ease 0.5s both; }
        .hero-desc  { animation: fadeUp  0.8s ease 0.8s both; }
        .hero-cta   { animation: fadeUp  0.8s ease 1.0s both; }
        .hero-img   { animation: fadeIn  1.5s ease 0.0s both; }
        .hero-line  { animation: fadeIn  1.0s ease 1.2s both; }
        .scroll-line { animation: scrollLine 2s ease 1.5s infinite; }

        .card-img { transition: transform 0.8s ease, opacity 0.6s ease; }
        .product-card:hover .card-img { transform: scale(1.05); opacity: 0.7; }

        .cat-img { transition: transform 0.8s ease, opacity 0.6s ease; }
        .cat-link:hover .cat-img { transform: scale(1.04); opacity: 0.45; }

        .coming-soon-dot { animation: pulse 2s ease infinite; }

        .shimmer-text {
          background: linear-gradient(90deg,
            rgba(240,237,230,0.3)  0%,
            rgba(240,237,230,0.85) 50%,
            rgba(240,237,230,0.3)  100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        .shop-btn:hover {
          opacity: 0.85;
        }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ position: "relative", height: "100svh", minHeight: "600px", overflow: "hidden" }}>

        {/* BG image */}
        <img
          src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=80&fm=webp"
          alt="2Z Minimal Streetwear"
          fetchPriority="high"
          loading="eager"
          className="hero-img"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center 30%",
            opacity: 0.38, filter: "grayscale(20%)",
          }}
        />

        {/* Gradient */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(8,8,8,0.15) 0%, transparent 30%, rgba(8,8,8,0.9) 82%, #080808 100%)",
        }} />

        {/* Top bar */}
        <div className="hero-tag" style={{
          position: "absolute", top: "24px", left: "24px", right: "24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "20px", height: "1px", background: "rgba(240,237,230,0.3)" }} />
            <span style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)" }}>
              Cairo · SS26
            </span>
          </div>
          <span style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)" }}>
            2Z
          </span>
        </div>

        {/* Main content */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: "clamp(24px, 5vw, 60px)",
          paddingBottom: "clamp(48px, 9vh, 90px)",
        }}>
          <h1 className="hero-title" style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "clamp(56px, 14vw, 140px)",
            fontWeight: 300,
            lineHeight: 0.86,
            letterSpacing: "-0.03em",
            color: "#f0ede6",
            margin: "0 0 32px",
          }}>
            Wear Nothing<br />
            Extra
          </h1>

          <div className="hero-desc" style={{ height: "1px", background: "rgba(240,237,230,0.12)", marginBottom: "20px" }} />

          <div className="hero-desc" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "20px",
          }}>
            <p style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(240,237,230,0.45)",
              lineHeight: 2,
              margin: 0,
            }}>
              Oversized T-Shirts<br />
              Black · White · Grey · Beige
            </p>

            <Link href="/products" className="shop-btn" style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "9px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#080808",
              textDecoration: "none",
              background: "#f0ede6",
              padding: "13px 28px",
              display: "inline-block",
              transition: "opacity 0.25s",
            }}>
              Shop Now
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-line" style={{
          position: "absolute", bottom: "28px", left: "50%",
          transform: "translateX(-50%)",
        }}>
          <div style={{ width: "1px", height: "44px", background: "rgba(240,237,230,0.1)", overflow: "hidden" }}>
            <div className="scroll-line" style={{ width: "100%", height: "100%", background: "rgba(240,237,230,0.45)" }} />
          </div>
        </div>

      </section>

      {/* ── NEW IN ── */}
      <section style={{ padding: "64px 24px 40px" }}>
        <RevealSection>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "28px" }}>
            <span style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#f0ede6" }}>New In</span>
            <Link href="/products" style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", textDecoration: "none", borderBottom: "1px solid rgba(240,237,230,0.2)", paddingBottom: "1px" }}>View All</Link>
          </div>
        </RevealSection>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "rgba(240,237,230,0.06)" }}>
          {products.map((p, i) => (
            <RevealSection key={p.id} delay={i * 100}>
              <Link href={`/products/${p.id}`} className="product-card" style={{ display: "block", textDecoration: "none" }}>
                <div style={{ aspectRatio: "3/4", position: "relative", overflow: "hidden", background: "#111" }}>
                  <img
                    src={colorImages[p.variants?.[0]?.color] || colorImages.BLACK}
                    alt={p.name}
                    loading="lazy"
                    className="card-img"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080808 0%, transparent 60%)" }} />
                  <div style={{ position: "absolute", bottom: "14px", left: "14px", right: "14px" }}>
                    <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "18px", fontWeight: 300, color: "#f0ede6", margin: "0 0 4px" }}>{p.name}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.5)" }}>
                        {p.variants?.[0]?.color || ""}
                      </span>
                      {p.originalPrice && Number(p.originalPrice) > Number(p.price) ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <span style={{ fontFamily: "Space Mono, monospace", fontSize: "7px", color: "rgba(240,237,230,0.3)", textDecoration: "line-through" }}>{Number(p.originalPrice)}</span>
                          <span style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", color: "rgba(240,237,230,0.6)" }}>{Number(p.price)} EGP</span>
                        </span>
                      ) : (
                        <span style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", color: "rgba(240,237,230,0.5)" }}>{Number(p.price)} EGP</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* ── STATEMENT ── */}
      <section style={{ padding: "80px 24px", textAlign: "center" }}>
        <RevealSection>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(240,237,230,0.08)" }} />
            <div>
              <p style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.28)", marginBottom: "20px", whiteSpace: "nowrap" }}>
                The 2Z Philosophy
              </p>
              <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(28px, 7vw, 52px)", fontWeight: 300, lineHeight: 1.2, color: "#f0ede6", margin: 0, whiteSpace: "nowrap" }}>
                Less noise. <em style={{ color: "rgba(240,237,230,0.38)" }}>More presence.</em>
              </h2>
            </div>
            <div style={{ flex: 1, height: "1px", background: "rgba(240,237,230,0.08)" }} />
          </div>
        </RevealSection>
      </section>

      {/* ── COMING SOON TEASER ── */}
      <section style={{ padding: "0 24px 24px" }}>
        <RevealSection delay={100}>
          <div style={{ border: "1px solid rgba(240,237,230,0.1)", display: "flex", alignItems: "stretch" }}>
            <div style={{ flex: 1, padding: "40px 28px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div className="coming-soon-dot" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(240,237,230,0.45)" }} />
                <span style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)" }}>Next Drop</span>
              </div>
              <h2 className="shimmer-text" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: "20px" }}>
                Sweatpants.
              </h2>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid rgba(240,237,230,0.12)", padding: "9px 20px", width: "fit-content" }}>
                <div className="coming-soon-dot" style={{ width: "4px", height: "4px", borderRadius: "50%", background: "rgba(240,237,230,0.4)" }} />
                <span style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)" }}>Coming Soon</span>
              </div>
            </div>
            <div style={{ width: "clamp(90px, 26%, 160px)", position: "relative", overflow: "hidden", borderLeft: "1px solid rgba(240,237,230,0.08)" }}>
              <img
                src="https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=50&fm=webp"
                alt="Sweatpants coming soon"
                loading="lazy"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.18, filter: "grayscale(100%)" }}
              />
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ── CATEGORIES ── */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", marginTop: "8px" }}>
        {[
          { name: "T-Shirts",   slug: "t-shirts",   img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=50&fm=webp", available: true  },
          { name: "Sweatpants", slug: "sweatpants",  img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=50&fm=webp", available: false },
        ].map((cat, i) => (
          <RevealSection key={cat.slug} delay={i * 150}>
            {cat.available ? (
              <Link href={`/products?category=${cat.slug}`} className="cat-link" style={{ position: "relative", height: "180px", overflow: "hidden", display: "block" }}>
                <img src={cat.img} alt={cat.name} loading="lazy" className="cat-img" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.32 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,8,0.85) 0%, transparent 65%)" }} />
                <div style={{ position: "absolute", bottom: "16px", left: "16px" }}>
                  <p style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.45)", marginBottom: "4px" }}>Collection</p>
                  <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: 300, color: "#f0ede6", margin: 0 }}>{cat.name}</p>
                </div>
              </Link>
            ) : (
              <div style={{ position: "relative", height: "180px", overflow: "hidden" }}>
                <img src={cat.img} alt={cat.name} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.1, filter: "grayscale(100%)" }} />
                <div style={{ position: "absolute", bottom: "16px", left: "16px" }}>
                  <p style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.22)", marginBottom: "4px" }}>Coming Soon</p>
                  <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: 300, color: "rgba(240,237,230,0.28)", margin: 0 }}>{cat.name}</p>
                </div>
              </div>
            )}
          </RevealSection>
        ))}
      </section>

      {/* ── FOOTER STRIP ── */}
      <RevealSection>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderTop: "1px solid rgba(240,237,230,0.06)", marginTop: "2px" }}>
          <span style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.25)" }}>2Z — 6th of October</span>
          <span style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.25)" }}>Oversized T-Shirts</span>
        </div>
      </RevealSection>

    </div>
  )
}