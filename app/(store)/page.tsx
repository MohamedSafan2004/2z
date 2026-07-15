import Link from "next/link"
import { db } from "@/lib/db"
import { RevealSection } from "@/components/RevealSection"

export const dynamic = "force-dynamic"
const colorImages: Record<string, string> = {
  BLACK: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-black.jpg",
  WHITE: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-white.jpg",
  GREY:  "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-grey.jpg",
  BEIGE: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-beige.jpg",
}

// بتضيف تحويلات Cloudinary (ضغط تلقائي + WebP + تصغير المقاس) من غير ما تلمس الصورة الأصلية
function optimizeCloudinaryUrl(url: string, width: number): string {
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`)
}

async function getFeaturedProducts() {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        select: { id: true, color: true, size: true, stockQuantity: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  })

  return products
    .filter((p) => p.category?.slug !== "sweatpants")
    .slice(0, 4)
    .map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    }))
}

export default async function Home() {
  const products = await getFeaturedProducts()

  return (
    <div className="home-root">
      <style>{`
        * { box-sizing: border-box; }

        .home-root {
          background: #080808;
          color: #f0ede6;
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
        }

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

        /* ── HERO ── */
        .hero-section {
          position: relative;
          overflow: hidden;
          width: 100%;
          max-width: 100%;
          height: 88vh;
          min-height: 560px;
        }
        @media (min-width: 768px) {
          .hero-section { height: 100vh; min-height: 560px; max-height: 900px; }
        }

        .hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          max-width: 100%;
          object-fit: cover;
          object-position: 78% center;
          opacity: 0.55;
          filter: grayscale(20%);
          animation: fadeIn 1.5s ease 0s both;
        }
        @media (min-width: 768px) {
          .hero-img { object-position: center 30%; opacity: 0.38; }
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(8,8,8,0.15) 0%, transparent 30%, rgba(8,8,8,0.9) 82%, #080808 100%);
        }

        .hero-topbar {
          position: absolute;
          top: 20px; left: 20px; right: 20px;
          display: flex; justify-content: space-between; align-items: center;
          animation: fadeUp 0.8s ease 0.2s both;
        }
        @media (min-width: 640px) {
          .hero-topbar { top: 24px; left: 24px; right: 24px; }
        }

        .hero-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 24px;
          padding-bottom: 56px;
          max-width: 100%;
        }
        @media (min-width: 640px) {
          .hero-content { padding: 40px; padding-bottom: 60px; }
        }
        @media (min-width: 768px) {
          .hero-content { padding: 60px; padding-bottom: 90px; }
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          line-height: 0.9;
          letter-spacing: -0.03em;
          color: #f0ede6;
          margin: 0 0 36px;
          font-size: 44px;
          animation: fadeUp 1.0s ease 0.5s both;
        }
        @media (min-width: 480px) { .hero-title { font-size: 60px; } }
        @media (min-width: 640px) { .hero-title { font-size: 80px; margin-bottom: 28px; } }
        @media (min-width: 900px) { .hero-title { font-size: 110px; } }
        @media (min-width: 1200px) { .hero-title { font-size: 120px; } }

        .hero-divider {
          height: 1px;
          background: rgba(240,237,230,0.12);
          margin-bottom: 32px;
          animation: fadeUp 0.8s ease 0.8s both;
        }
        @media (min-width: 640px) {
          .hero-divider { margin-bottom: 20px; }
        }

        .hero-bottom-row {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 24px;
          animation: fadeUp 0.8s ease 1.0s both;
        }
        @media (min-width: 560px) {
          .hero-bottom-row {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-end;
            gap: 16px;
          }
        }

        .hero-desc {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(240,237,230,0.45);
          line-height: 1.9;
          margin: 0;
        }
        @media (min-width: 480px) { .hero-desc { font-size: 10px; } }

        .shop-btn {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #080808;
          text-decoration: none;
          background: #f0ede6;
          padding: 13px 26px;
          display: inline-block;
          transition: opacity 0.25s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .shop-btn:hover { opacity: 0.85; }

        .scroll-indicator {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: none;
        }
        @media (min-width: 768px) {
          .scroll-indicator { display: block; }
        }
        .scroll-track { width: 1px; height: 44px; background: rgba(240,237,230,0.1); overflow: hidden; }
        .scroll-line { width: 100%; height: 100%; background: rgba(240,237,230,0.45); animation: scrollLine 2s ease 1.5s infinite; }

        /* ── NEW IN ── */
        .newin-section { padding: 56px 20px 40px; max-width: 100%; }
        @media (min-width: 640px) { .newin-section { padding: 64px 24px 40px; } }

        .newin-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px; flex-wrap: wrap; gap: 10px; }
        .newin-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: #f0ede6; }
        .newin-viewall { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(240,237,230,0.3); text-decoration: none; border-bottom: 1px solid rgba(240,237,230,0.2); padding-bottom: 1px; }

        .newin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(240,237,230,0.06); max-width: 100%; }
        @media (min-width: 640px) { .newin-grid { grid-template-columns: repeat(4, 1fr); } }

        .card-img { transition: transform 0.8s ease, opacity 0.6s ease; }
        .product-card:hover .card-img { transform: scale(1.05); opacity: 0.7; }

        .newin-name  { font-family: 'Cormorant Garamond', serif; font-weight: 300; color: #f0ede6; margin: 0 0 4px; line-height: 1.15; font-size: 15px; }
        .newin-cat   { font-family: 'Space Mono', monospace; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(240,237,230,0.4); font-size: 7px; white-space: nowrap; }
        .newin-price { font-family: 'Space Mono', monospace; color: rgba(240,237,230,0.7); font-size: 13px; white-space: nowrap; }
        .newin-orig  { font-family: 'Space Mono', monospace; color: rgba(240,237,230,0.3); text-decoration: line-through; font-size: 10.5px; white-space: nowrap; }
        .newin-meta-row { display: flex; justify-content: space-between; align-items: center; gap: 6px; }

        @media (min-width: 480px) {
          .newin-name  { font-size: 17px; }
          .newin-price { font-size: 14px; }
        }
        @media (min-width: 640px) {
          .newin-name  { font-size: 19px; }
          .newin-cat   { font-size: 8px; }
          .newin-price { font-size: 15px; }
          .newin-orig  { font-size: 12px; }
        }

        /* ── STATEMENT ── */
        .statement-section { padding: 64px 20px; text-align: center; max-width: 100%; overflow: hidden; }
        @media (min-width: 640px) { .statement-section { padding: 80px 24px; } }
        .statement-row { display: flex; align-items: center; gap: 16px; max-width: 600px; margin: 0 auto; }
        .statement-line { flex: 1; height: 1px; background: rgba(240,237,230,0.08); min-width: 12px; }
        .statement-label { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.25em; text-transform: uppercase; color: rgba(240,237,230,0.28); margin-bottom: 16px; }
        .statement-heading { font-family: 'Cormorant Garamond', serif; font-weight: 300; line-height: 1.25; color: #f0ede6; margin: 0; font-size: 22px; }
        @media (min-width: 480px) { .statement-heading { font-size: 28px; } .statement-label { font-size: 9px; } }
        @media (min-width: 640px) { .statement-heading { font-size: 38px; } }
        @media (min-width: 900px)  { .statement-heading { font-size: 48px; } }

        /* ── COMING SOON ── */
        .comingsoon-section { padding: 0 20px 20px; max-width: 100%; }
        @media (min-width: 640px) { .comingsoon-section { padding: 0 24px 24px; } }
        .comingsoon-box { border: 1px solid rgba(240,237,230,0.1); display: flex; align-items: stretch; max-width: 100%; overflow: hidden; }
        .comingsoon-dot { animation: pulse 2s ease infinite; border-radius: 50%; background: rgba(240,237,230,0.45); }

        .shimmer-text {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          letter-spacing: -0.02em;
          margin-bottom: 18px;
          font-size: 24px;
          background: linear-gradient(90deg, rgba(240,237,230,0.3) 0%, rgba(240,237,230,0.85) 50%, rgba(240,237,230,0.3) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        @media (min-width: 480px) { .shimmer-text { font-size: 30px; } }
        @media (min-width: 640px) { .shimmer-text { font-size: 40px; } }

        /* ── CATEGORIES ── */
        .categories-section { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; margin-top: 8px; max-width: 100%; }
        .cat-img { transition: transform 0.8s ease, opacity 0.6s ease; }
        .cat-link:hover .cat-img { transform: scale(1.04); opacity: 0.45; }
      `}</style>

      {/* ── HERO ── */}
      <section className="hero-section">
        <img
          src="https://res.cloudinary.com/ghetnovd/image/upload/2z-store/hero.png"
          alt="2Z Minimal Streetwear"
          fetchPriority="high"
          loading="eager"
          className="hero-img"
        />

        <div className="hero-overlay" />

        <div className="hero-topbar">
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

        <div className="hero-content">
          <h1 className="hero-title">
            Wear Nothing<br />
            Extra
          </h1>

          <div className="hero-divider" />

          <div className="hero-bottom-row">
            <p className="hero-desc">
              Oversized T-Shirts<br />
              Black · White · Grey · Beige
            </p>

            <Link href="/products" className="shop-btn">
              Shop Now
            </Link>
          </div>
        </div>

        <div className="scroll-indicator">
          <div className="scroll-track">
            <div className="scroll-line" />
          </div>
        </div>
      </section>

      {/* ── NEW IN ── */}
      <section className="newin-section">
        <RevealSection>
          <div className="newin-header">
            <span className="newin-label">New In</span>
            <Link href="/products" className="newin-viewall">View All</Link>
          </div>
        </RevealSection>
        <div className="newin-grid">
          {products.map((p, i) => {
            const color = p.variants?.[0]?.color || ""
            const colorLabel = color ? color.charAt(0) + color.slice(1).toLowerCase() : ""
            return (
              <RevealSection key={p.id} delay={i * 100}>
                <Link href={`/products/${p.id}`} className="product-card" style={{ display: "block", textDecoration: "none" }}>
                  <div style={{ aspectRatio: "3/4", position: "relative", overflow: "hidden", background: "#111" }}>
                    <img
                      src={optimizeCloudinaryUrl(colorImages[color] || colorImages.BLACK, 600)}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="card-img"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080808 0%, transparent 60%)" }} />
                    <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px" }}>
                      <p className="newin-name">
                        Oversize T-Shirt<br />
                        <span style={{ color: "rgba(240,237,230,0.5)" }}>— {colorLabel}</span>
                      </p>
                      <div className="newin-meta-row">
                        <span className="newin-cat">T-Shirts</span>
                        <span aria-hidden="true"> </span>
                        {p.originalPrice && p.originalPrice > p.price ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span className="newin-orig">{p.originalPrice}</span>
                            <span className="newin-price">{p.price} EGP</span>
                          </span>
                        ) : (
                          <span className="newin-price" style={{ color: "rgba(240,237,230,0.5)" }}>{p.price} EGP</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </RevealSection>
            )
          })}
        </div>
      </section>

      {/* ── STATEMENT ── */}
      <section className="statement-section">
        <RevealSection>
          <div className="statement-row">
            <div className="statement-line" />
            <div>
              <p className="statement-label">The 2Z Philosophy</p>
              <h2 className="statement-heading">
                Less noise. <em style={{ color: "rgba(240,237,230,0.38)" }}>More presence.</em>
              </h2>
            </div>
            <div className="statement-line" />
          </div>
        </RevealSection>
      </section>

      {/* ── COMING SOON TEASER ── */}
      <section className="comingsoon-section">
        <RevealSection delay={100}>
          <div className="comingsoon-box">
            <div style={{ flex: 1, padding: "28px 20px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div className="comingsoon-dot" style={{ width: "5px", height: "5px" }} />
                <span style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)" }}>Next Drop</span>
              </div>
              <h2 className="shimmer-text">Sweatpants.</h2>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid rgba(240,237,230,0.12)", padding: "9px 16px", width: "fit-content" }}>
                <div className="comingsoon-dot" style={{ width: "4px", height: "4px" }} />
                <span style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)" }}>Coming Soon</span>
              </div>
            </div>
            <div style={{ width: "clamp(80px, 26%, 160px)", position: "relative", overflow: "hidden", borderLeft: "1px solid rgba(240,237,230,0.08)", flexShrink: 0 }}>
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
      <section className="categories-section">
        {[
          { name: "T-Shirts",   slug: "t-shirts",   img: optimizeCloudinaryUrl("https://res.cloudinary.com/ghetnovd/image/upload/2z-store/collection-tee.jpg", 500), available: true  },
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderTop: "1px solid rgba(240,237,230,0.06)", marginTop: "2px", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.25)" }}>2Z — 6th of October</span>
          <span style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.25)" }}>Oversized T-Shirts</span>
        </div>
      </RevealSection>

    </div>
  )
}