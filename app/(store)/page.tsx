"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"

const products = [
  { id: "1", name: "Essential Tee", price: 350, color: "Black", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=50&fm=webp" },
  { id: "2", name: "Essential Tee", price: 350, color: "White", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=50&fm=webp" },
  { id: "3", name: "Sweatpants", price: 650, color: "Black", img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=50&fm=webp" },
  { id: "4", name: "Sweatpants", price: 650, color: "White", img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=50&fm=webp" },
]

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
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
  }, [])
  return ref
}

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div style={{ animation: `heroFade 0.8s ease ${delay}ms both` }}>
      {children}
    </div>
  )
}

export default function Home() {
  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh" }}>
      <style>{`
        @keyframes heroFade {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .hero-text { animation: heroFade 1s ease 0.3s both; }
        .hero-sub { animation: heroFade 1s ease 0.6s both; }
        .hero-btn { animation: heroFade 1s ease 0.9s both; }
        .hero-img { animation: heroFade 1.2s ease 0s both; }
        .product-card { transition: transform 0.6s ease, opacity 0.6s ease; }
        .product-card:hover .card-img { transform: scale(1.06); opacity: 0.8; }
        .card-img { transition: transform 0.8s ease, opacity 0.6s ease; }
        .coming-soon-dot { animation: pulse 2s ease infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, rgba(240,237,230,0.3) 0%, rgba(240,237,230,0.8) 50%, rgba(240,237,230,0.3) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* Hero */}
      <section className="relative h-screen overflow-hidden" aria-label="Hero section">
        <img
          src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=70&fm=webp"
          alt="2Z Minimal Streetwear"
          fetchPriority="high"
          loading="eager"
          className="hero-img absolute inset-0 w-full h-full object-cover opacity-45 grayscale-[30%]"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 20%, #080808 100%)" }} />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
          <p className="hero-text text-xs tracking-[0.3em] uppercase mb-3" style={{ color: "rgba(240,237,230,0.5)" }}>
            6th of October — 2026
          </p>
          <h1 className="hero-text font-serif font-light leading-none" style={{ fontSize: "clamp(40px, 10vw, 100px)", letterSpacing: "-0.02em", color: "#f0ede6" }}>
            Wear<br /><em style={{ color: "rgba(240,237,230,0.6)" }}>Nothing</em><br />Extra.
          </h1>
          <div className="hero-sub flex flex-col gap-4 mt-6 md:flex-row md:justify-between md:items-end">
            <p className="text-xs tracking-widest uppercase leading-loose" style={{ color: "rgba(240,237,230,0.5)" }}>
              Oversized T-shirts.<br />Black & white.<br />That's it.
            </p>
            <Link href="/products" className="hero-btn btn-outline text-xs tracking-[0.2em] uppercase px-5 py-3" aria-label="Shop 2Z collection">
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* New In */}
      <section className="px-6 py-10" aria-label="New arrivals">
        <RevealSection>
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs tracking-[0.25em] uppercase" style={{ color: "#f0ede6" }}>New In</span>
          </div>
        </RevealSection>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.filter(p => p.name === "Essential Tee").map((p, i) => (
            <RevealSection key={p.id} delay={i * 100}>
              <Link
                href={`/products/${p.id}`}
                className="product-card group relative block"
                aria-label={`View ${p.name} in ${p.color}`}
              >
                <div className="aspect-[3/4] relative overflow-hidden" style={{ background: p.color === "Black" ? "#111" : "#1a1a1a" }}>
                  <img
                    src={p.img}
                    alt={`${p.name} in ${p.color}`}
                    loading="lazy"
                    className="card-img absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[20%]"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #080808 0%, transparent 55%)" }} />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="font-serif font-light text-lg" style={{ color: "#f0ede6" }}>{p.name}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs tracking-widest uppercase" style={{ color: "rgba(240,237,230,0.6)" }}>{p.color}</span>
                      <span className="text-xs" style={{ color: "rgba(240,237,230,0.6)" }}>{p.price} EGP</span>
                    </div>
                  </div>
                </div>
              </Link>
            </RevealSection>
          ))}
        </div>
      </section>

      {/* Statement */}
      <section className="px-6 py-20 text-center" aria-label="Brand philosophy">
        <RevealSection>
          <p className="text-xs tracking-[0.3em] uppercase mb-5" style={{ color: "rgba(240,237,230,0.4)" }}>The 2Z Philosophy</p>
          <h2 className="font-serif font-light leading-tight" style={{ fontSize: "clamp(32px, 8vw, 60px)", color: "#f0ede6" }}>
            Less noise.<br /><em style={{ color: "rgba(240,237,230,0.5)" }}>More presence.</em>
          </h2>
        </RevealSection>
      </section>

      {/* New Collection Teaser */}
      <section className="px-6 py-6" aria-label="Coming soon collection">
        <RevealSection delay={100}>
          <div style={{
            border: "1px solid rgba(240,237,230,0.08)",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Background image */}
            <img
              src="https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=50&fm=webp"
              alt="Sweatpants collection coming soon"
              loading="lazy"
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover",
                opacity: 0.08,
                filter: "grayscale(100%)",
              }}
            />

            {/* Noise overlay */}
            <div style={{
              position: "absolute", inset: 0,
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(240,237,230,0.01) 2px, rgba(240,237,230,0.01) 4px)",
            }} />

            <div style={{ position: "relative", padding: "48px 32px", textAlign: "center" }}>

              {/* Live dot */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
                <div className="coming-soon-dot" style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: "#f0ede6",
                }} />
                <span style={{ fontSize: "9px", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)" }}>
                  Next Drop
                </span>
              </div>

              {/* Title */}
              <h2 className="shimmer-text font-serif font-light" style={{
                fontSize: "clamp(28px, 7vw, 56px)",
                letterSpacing: "-0.02em",
                marginBottom: "16px",
                fontFamily: "Cormorant Garamond, serif",
              }}>
                Sweatpants.
              </h2>
{/* 
              <p style={{
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(240,237,230,0.3)",
                marginBottom: "8px",
              }}>
                Minimal. Heavy. Yours.
              </p>

              <p style={{
                fontSize: "9px",
                letterSpacing: "0.15em",
                color: "rgba(240,237,230,0.2)",
                marginBottom: "32px",
              }}>
                Black & Grey — 650 EGP
              </p> */}

              {/* Coming Soon badge */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid rgba(240,237,230,0.15)",
                padding: "10px 20px",
              }}>
                <div className="coming-soon-dot" style={{
                  width: "5px", height: "5px", borderRadius: "50%",
                  background: "rgba(240,237,230,0.5)",
                }} />
                <span style={{
                  fontSize: "9px",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "rgba(240,237,230,0.5)",
                }}>
                  Coming Soon
                </span>
              </div>

            </div>
          </div>
        </RevealSection>
      </section>

      {/* Categories */}
      <section className="grid grid-cols-2 gap-[2px] mt-6" aria-label="Shop by category">
        {[
          { name: "T-Shirts", slug: "t-shirts", img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=50&fm=webp", available: true },
          { name: "Sweatpants", slug: "sweatpants", img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&q=50&fm=webp", available: false },
        ].map((cat, i) => (
          <RevealSection key={cat.slug} delay={i * 150}>
            {cat.available ? (
              <Link
                href={`/products?category=${cat.slug}`}
                className="relative h-44 overflow-hidden group block"
                aria-label={`Shop ${cat.name} collection`}
              >
                <img
                  src={cat.img}
                  alt={`2Z ${cat.name} collection`}
                  loading="lazy"
                  className="card-img absolute inset-0 w-full h-full object-cover opacity-35 grayscale-[40%]"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: "rgba(240,237,230,0.6)" }}>Collection</p>
                  <p className="font-serif font-light text-2xl" style={{ color: "#f0ede6" }}>{cat.name}</p>
                </div>
              </Link>
            ) : (
              <div className="relative h-44 overflow-hidden" style={{ cursor: "default" }}>
                <img
                  src={cat.img}
                  alt={`2Z ${cat.name} collection`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover grayscale-[80%]"
                  style={{ opacity: 0.15 }}
                />
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <p className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: "rgba(240,237,230,0.3)" }}>Coming Soon</p>
                  <p className="font-serif font-light text-2xl" style={{ color: "rgba(240,237,230,0.4)" }}>{cat.name}</p>
                </div>
              </div>
            )}
          </RevealSection>
        ))}
      </section>

      {/* Footer Strip */}
      <RevealSection>
        <div className="flex justify-between items-center px-6 py-5" style={{ borderTop: "1px solid rgba(240,237,230,0.08)", marginTop: "2px" }}>
          <span className="text-xs tracking-widest uppercase" style={{ color: "rgba(240,237,230,0.4)" }}>2Z — 6th of October, Egypt</span>
          <span className="text-xs tracking-widest uppercase" style={{ color: "rgba(240,237,230,0.4)" }}>Oversized T-shirts</span>
        </div>
      </RevealSection>

    </div>
  )
}