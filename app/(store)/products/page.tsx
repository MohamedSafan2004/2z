import Link from "next/link"
import { db } from "@/lib/db"

// صورة الـ Main بس لكل لون — دي اللي بتظهر في صفحة قائمة المنتجات
const colorImages: Record<string, string> = {
  BLACK: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-black.jpg",
  WHITE: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-white.jpg",
  GREY:  "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-grey.jpg",
  BEIGE: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-beige.jpg",
}

export const dynamic = "force-dynamic"
// بتضيف تحويلات Cloudinary (ضغط تلقائي + WebP + تصغير المقاس) من غير ما تلمس الصورة الأصلية
function optimizeCloudinaryUrl(url: string, width: number): string {
  return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`)
}
async function getProducts() {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        select: { id: true, color: true, size: true, stockQuantity: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 21,
  })

  return products
    .filter((p) => p.category?.slug !== "sweatpants")
    .map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    }))
}

export default async function ProductsPage() {
  const products = await getProducts()

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

        /* ── Sale badge on cards ── */
        @keyframes cardSaleShine {
          0%   { background-position: -60px 0; }
          100% { background-position: 160px 0; }
        }
        .card-sale-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #080808;
          background: #c8f04f;
          padding: 4px 8px;
          overflow: hidden;
        }
        .card-sale-badge::after {
          content: "";
          position: absolute;
          top: 0; left: 0;
          width: 30px; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent);
          animation: cardSaleShine 2.6s ease-in-out infinite;
        }

        .p-name  { font-size: 15px; }
        .p-cat   { font-size: 7px; white-space: nowrap; }
        .p-price { font-size: 13px; white-space: nowrap; }
        .p-orig  { font-size: 10.5px; white-space: nowrap; }
        .p-meta-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }

        @media (min-width: 480px) {
          .p-name  { font-size: 17px; }
          .p-price { font-size: 14px; }
        }

        @media (min-width: 640px) {
          .p-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .p-name  { font-size: 19px; }
          .p-cat   { font-size: 8px; }
          .p-price { font-size: 15px; }
          .p-orig  { font-size: 12px; }
        }
        @media (min-width: 1024px) { .p-grid { grid-template-columns: repeat(4, 1fr) !important; } }

        /* ── Promo banner — calm, static, two tiers side by side ── */
        .promo-banner {
          border: 1px solid rgba(200,240,79,0.18);
          background: rgba(200,240,79,0.03);
          padding: 14px 18px;
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
        }
        .promo-banner-item { display: flex; align-items: center; gap: 9px; }
        .promo-banner-num {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: #080808;
          background: #c8f04f;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .promo-banner-txt {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(240,237,230,0.75);
          white-space: nowrap;
        }
        .promo-banner-divider { width: 1px; height: 16px; background: rgba(240,237,230,0.12); flex-shrink: 0; }
        @media (max-width: 420px) {
          .promo-banner { flex-wrap: wrap; gap: 10px 14px; padding: 12px 14px; }
          .promo-banner-divider { display: none; }
          .promo-banner-txt { font-size: 9px; }
        }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 20px 80px" }}>

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
              Oversize<br />
              <em style={{ color: "rgba(240,237,230,0.35)", fontStyle: "italic" }}>T-Shirts</em>
            </h1>
            <p style={{
              fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase",
              color: "rgba(240,237,230,0.3)", lineHeight: 2, margin: 0,
            }}>
              Black · White · Grey · Beige
            </p>
          </div>
        </div>

        <div className="promo-banner">
          <div className="promo-banner-item">
            <span className="promo-banner-num">2</span>
            <span className="promo-banner-txt">Buy 2, Get 1 Free</span>
          </div>
          <div className="promo-banner-divider" />
          <div className="promo-banner-item">
            <span className="promo-banner-num">3</span>
            <span className="promo-banner-txt">Buy 3, Get 2 Free</span>
          </div>
        </div>

        <p style={{
          fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase",
          color: "rgba(240,237,230,0.25)", marginBottom: "24px",
        }}>
          Our Products
        </p>

        <div
          className="p-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2px" }}
        >
          {products.map((p, i) => {
            const color = p.variants?.[0]?.color || "BLACK"
            const colorLabel = color ? color.charAt(0) + color.slice(1).toLowerCase() : ""
            return (
            <Link
              href={`/products/${p.id}`}
              key={p.id}
              className="p-card"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div style={{ aspectRatio: "3/4", overflow: "hidden", background: "#111", position: "relative" }}>
                {p.originalPrice && p.originalPrice > p.price && (
                  <span className="card-sale-badge">Sale</span>
                )}
                <img
                  src={optimizeCloudinaryUrl(colorImages[color] || colorImages.BLACK, 600)}
                  alt={`Oversize T-Shirt — ${colorLabel}`}
                  loading="lazy"
                  className="p-img"
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.65 }}
                />
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, #080808 0%, transparent 55%)",
                }} />

                <div style={{ position: "absolute", bottom: "16px", left: "16px", right: "16px" }}>
                  <p
                    className="p-name"
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontWeight: 300,
                      color: "#f0ede6", margin: "0 0 6px",
                      lineHeight: 1.15,
                      transition: "color 0.3s",
                    }}
                  >
                    Oversize T-Shirt<br />
                    <span style={{ color: "rgba(240,237,230,0.5)" }}>— {colorLabel}</span>
                  </p>
                  <div className="p-meta-row">
                    <span className="p-cat" style={{
                      letterSpacing: "0.2em",
                      textTransform: "uppercase", color: "rgba(240,237,230,0.4)",
                    }}>
                      T-Shirts
                    </span>
                    {p.originalPrice && p.originalPrice > p.price ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="p-orig" style={{ color: "rgba(240,237,230,0.3)", textDecoration: "line-through" }}>
                          {p.originalPrice}
                        </span>
                        <span className="p-price" style={{ color: "rgba(240,237,230,0.7)" }}>
                          {p.price} EGP
                        </span>
                      </span>
                    ) : (
                      <span className="p-price" style={{ color: "rgba(240,237,230,0.5)" }}>
                        {p.price} EGP
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
            )
          })}
        </div>

        {products.length === 0 && (
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