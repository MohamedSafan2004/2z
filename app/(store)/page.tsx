// app/(store)/page.tsx
import Link from "next/link"
import { Suspense } from "react"
import { db } from "@/lib/db"
import { RevealSection } from "@/components/RevealSection"
import { NewInScrollProgress } from "@/components/NewInScrollProgress"
import { SkeletonBlock } from "@/components/Skeleton"
import { ReviewsGallery } from "@/components/ReviewsGallery"

// بيتخزن لمدة 60 ثانية وبعدين بيتجدد تلقائياً — بدل force-dynamic اللي كانت بتعمل استعلام جديد
// للداتابيز في *كل* زيارة (مفيش كاشينج خالص) ودة كانت سبب رئيسي في ضرب
// الـ monthly query limit بتاع الداتابيز. 60 ثانية فرق محسوسش عملياً للزائر
// (الستوك/السعر بيتحدث خلال دقيقة بالكتير لو الأدمن عدل حاجة)، بس بيوفر
// آلاف الاستعلامات على الصفحة الأكتر زيارة في الموقع.
export const revalidate = 60

const colorImages: Record<string, string> = {
  BLACK: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-black.jpg",
  WHITE: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-white.jpg",
  GREY:  "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-grey.jpg",
  BEIGE: "https://res.cloudinary.com/ghetnovd/image/upload/2z-store/tee-beige.jpg",
}

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

// Best Sellers — التيشيرت الأسود والأبيض تحديدًا (أكتر 2 لون مبيعًا)
async function getBestSellers() {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        select: { id: true, color: true, size: true, stockQuantity: true },
      },
    },
  })

  const flat = products
    .filter((p) => p.category?.slug !== "sweatpants")
    .map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    }))

  const black = flat.find((p) => p.variants?.some((v) => v.color === "BLACK"))
  const white = flat.find((p) => p.variants?.some((v) => v.color === "WHITE"))

  return [black, white].filter((p): p is NonNullable<typeof p> => Boolean(p))
}

// جزء الداتابيز لوحده، بيسمح لباقي الصفحة إنها متستناش
async function NewInSection() {
  const products = await getFeaturedProducts()

  return (
    <>
      {products.map((p, i) => {
        const color = p.variants?.[0]?.color || ""
        const colorLabel = color ? color.charAt(0) + color.slice(1).toLowerCase() : ""
        return (
          <RevealSection key={p.id} delay={i * 100} className="newin-reveal-item">
            <Link href={`/products/${p.id}`} className="product-card newin-card" style={{ display: "block", textDecoration: "none", width: "100%" }}>
              <div style={{ aspectRatio: "3/4", width: "100%", position: "relative", overflow: "hidden", background: "#111" }}>
                {p.originalPrice && p.originalPrice > p.price && (
                  <span className="card-sale-badge">Sale</span>
                )}
                <img
                  src={optimizeCloudinaryUrl(colorImages[color] || colorImages.BLACK, 600)}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="card-img"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080808 0%, rgba(8,8,8,0.7) 10%, transparent 38%)" }} />
                <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px" }}>
                  <p className="newin-name">
                    Oversize T-Shirt<br />
                    <span style={{ color: "rgba(240,237,230,0.75)" }}>— {colorLabel}</span>
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
                      <span className="newin-price" style={{ color: "#f0ede6" }}>{p.price} EGP</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </RevealSection>
        )
      })}
    </>
  )
}

function NewInSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ aspectRatio: "3/4", width: "100%" }}>
          <SkeletonBlock height="100%" />
        </div>
      ))}
    </>
  )
}

// كارت مختلف عن New In عمدًا — صف أفقي "ranked showcase" برقم ترتيب بصري (01/02)
async function BestSellersSection() {
  const products = await getBestSellers()

  return (
    <>
      {products.map((p, i) => {
        const color = p.variants?.[0]?.color || ""
        const colorLabel = color ? color.charAt(0) + color.slice(1).toLowerCase() : ""
        return (
          <RevealSection key={p.id} delay={i * 100}>
            <Link href={`/products/${p.id}`} className="bs-card">
              <div className="bs-imgwrap">
                <img
                  src={optimizeCloudinaryUrl(colorImages[color] || colorImages.BLACK, 400)}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="bs-img"
                />
              </div>
              <div className="bs-body">
                <span className="bs-toplabel">
                  <span className="bs-toplabel-bar" />
                  Best Seller
                </span>
                <p className="bs-name">
                  Oversize Tee <span>— {colorLabel}</span>
                </p>
                <div className="bs-meta">
                  <span className="bs-cat">T-Shirts</span>
                  {p.originalPrice && p.originalPrice > p.price ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span className="newin-orig">{p.originalPrice}</span>
                      <span className="bs-price">{p.price} EGP</span>
                    </span>
                  ) : (
                    <span className="bs-price">{p.price} EGP</span>
                  )}
                </div>
              </div>
            </Link>
          </RevealSection>
        )
      })}
    </>
  )
}

function BestSellersSkeleton() {
  return (
    <>
      {[1, 2].map((i) => (
        <div key={i} style={{ height: "140px", width: "100%" }}>
          <SkeletonBlock height="100%" />
        </div>
      ))}
    </>
  )
}

export default function Home() {
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
          opacity: 0.85;
          filter: grayscale(0%);
          animation: fadeIn 1.5s ease 0s both;
        }
        @media (min-width: 768px) {
          .hero-img { object-position: center 30%; opacity: 0.72; }
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to bottom, rgba(8,8,8,0.05) 0%, transparent 22%, rgba(8,8,8,0.6) 64%, rgba(8,8,8,0.96) 88%, #080808 100%),
            linear-gradient(to right, rgba(8,8,8,0.3) 0%, transparent 45%);
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
          text-shadow: 0 4px 24px rgba(0,0,0,0.55);
          animation: fadeUp 1.0s ease 0.5s both;
        }
        @media (min-width: 480px) { .hero-title { font-size: 60px; } }
        @media (min-width: 640px) { .hero-title { font-size: 80px; margin-bottom: 28px; } }
        @media (min-width: 900px) { .hero-title { font-size: 110px; } }
        @media (min-width: 1200px) { .hero-title { font-size: 120px; } }

        .hero-divider {
          height: 2px;
          width: 64px;
          background: linear-gradient(90deg, #c8f04f, rgba(240,237,230,0.12));
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
          color: rgba(240,237,230,0.7);
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
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: block;
        }
        @media (min-width: 768px) {
          .scroll-indicator { bottom: 20px; }
        }
        .scroll-track { width: 1px; height: 34px; background: rgba(240,237,230,0.1); overflow: hidden; }
        @media (min-width: 768px) { .scroll-track { height: 44px; } }
        .scroll-line { width: 100%; height: 100%; background: rgba(240,237,230,0.45); animation: scrollLine 2s ease 1.5s infinite; }

        /* ── NEW IN ── */
        .newin-section { padding: 56px 20px 40px; max-width: 100%; }
        @media (min-width: 640px) { .newin-section { padding: 64px 24px 40px; } }

        /* ── MARQUEE ── */
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-wrap {
          overflow: hidden;
          background: #0d0d0d;
          border-top: 1px solid rgba(240,237,230,0.08);
          border-bottom: 1px solid rgba(240,237,230,0.08);
          padding: 12px 0;
          width: 100%;
        }
        .marquee-track {
          display: flex;
          gap: 48px;
          width: max-content;
          animation: marqueeScroll 22s linear infinite;
        }
        .marquee-item {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgb(240, 237, 230);
          white-space: nowrap;
        }
        .marquee-dot { color: rgba(240,237,230,0.15); margin-left: 48px; }

        /* ── SHIPPING BANNER (home) ── */
        .home-shipping-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1px solid rgba(240,237,230,0.1);
          background: rgba(240,237,230,0.02);
          padding: 12px 16px;
          color: rgba(240,237,230,0.55);
        }
        .home-shipping-banner svg { flex-shrink: 0; opacity: 0.7; }
        .home-shipping-text {
          font-family: 'Space Mono', monospace;
          font-size: 9.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          line-height: 1.5;
        }
        .home-shipping-text strong { color: #f0ede6; font-weight: 700; }
        @media (min-width: 480px) { .home-shipping-text { font-size: 10.5px; } }

        .newin-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px; flex-wrap: wrap; gap: 10px; }
        .newin-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: #f0ede6; }
        .newin-viewall { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase; color: rgb(240, 237, 230); text-decoration: none; border-bottom: 1px solid rgba(255, 254, 253, 0.66); padding-bottom: 1px; }

        .newin-grid {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 0 20px 6px;
          margin: 0 -20px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          max-width: 100vw;
          position: relative;
          /* مهم: بدون ده الـ scroll-snap-type: x mandatory كان بيلخبط mobile swipe الرأسي للصفحة
             مع الـ swipe الأفقي الداخلي للكروت — المتصفح كان أحيانًا بيفسر أي swipe زي الـ
             مقصود أفقي حتى لو الإصبع بيتحرك رأسي مع ميل بسيط للجنب. touch-action: pan-y
             بيقول للمتصفح صراحة: الحركة الرأسية (pan-y) دايمًا تعدي للصفحة، والأفقي
             فقط للـ swipe الداخلي بتاع الكروتل — مفيش لبس الموبايل (الـ CSS مليهشي فيها أصلًا
             بيتحول لـ display: grid فوق 640px). */
          touch-action: pan-y;
        }
        .newin-grid::-webkit-scrollbar { display: none; }
        .newin-card {
          flex: 0 0 42vw;
          max-width: 190px;
          scroll-snap-align: start;
        }
        .newin-reveal-item { flex: 0 0 42vw; max-width: 190px; }
        @media (min-width: 640px) {
          .newin-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1px;
            background: rgba(240,237,230,0.06);
            overflow-x: visible;
            padding: 0;
            margin: 0;
            scroll-snap-type: none;
          }
          .newin-card { flex: none; max-width: none; }
          .newin-reveal-item { flex: none; max-width: none; }
        }

        .newin-scroll-wrap { position: relative; }

        .newin-progress-track {
          height: 1px;
          background: rgba(240,237,230,0.08);
          margin: 12px 20px 0;
          position: relative;
          overflow: hidden;
        }
        .newin-progress-fill {
          position: absolute; left: 0; top: 0; height: 100%;
          background: rgba(240,237,230,0.4);
          transition: width 0.15s ease, transform 0.1s linear;
        }
        @media (min-width: 640px) { .newin-progress-track { display: none; } }

        .card-img { transition: transform 0.8s ease, opacity 0.6s ease; }
        .product-card:hover .card-img { transform: scale(1.05); opacity: 0.95; }

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

        /* ── BEST SELLERS (ranked showcase, distinct from New In) ── */
        .bestsellers-section { padding: 56px 20px 40px; max-width: 100%; }
        @media (min-width: 640px) { .bestsellers-section { padding: 64px 24px 40px; } }

        .bs-list { display: flex; flex-direction: column; gap: 10px; max-width: 100%; }
        @media (min-width: 900px) { .bs-list { max-width: 640px; margin: 0 auto; } }

        .bs-card {
          display: flex;
          align-items: stretch;
          text-decoration: none;
          border: 1px solid rgba(240,237,230,0.1);
          background: rgba(240,237,230,0.015);
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s ease;
        }
        .bs-card:hover { border-color: rgba(240,237,230,0.25); }

        .bs-imgwrap {
          width: 110px;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          aspect-ratio: 3/4;
        }
        @media (min-width: 480px) { .bs-imgwrap { width: 130px; } }
        @media (min-width: 640px) { .bs-imgwrap { width: 150px; } }

        .bs-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.9; transition: transform 0.8s ease, opacity 0.6s ease; }
        .bs-card:hover .bs-img { transform: scale(1.05); opacity: 1; }

        .bs-body {
          flex: 1;
          padding: 14px 14px 14px 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }
        @media (min-width: 640px) { .bs-body { padding: 16px 20px; } }

        .bs-toplabel {
          font-family: 'Space Mono', monospace;
          font-size: 7.5px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #c8f04f;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .bs-toplabel-bar { width: 12px; height: 1px; background: #c8f04f; }

        .bs-name { font-family: 'Cormorant Garamond', serif; font-weight: 300; color: #f0ede6; font-size: 19px; line-height: 1.1; margin: 0 0 6px; }
        .bs-name span { color: rgba(240,237,230,0.5); font-size: 14px; }
        @media (min-width: 480px) { .bs-name { font-size: 21px; } .bs-name span { font-size: 15px; } }
        @media (min-width: 640px) { .bs-name { font-size: 24px; } .bs-name span { font-size: 17px; } }

        .bs-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .bs-cat { font-family: 'Space Mono', monospace; font-size: 7.5px; letter-spacing: 0.15em; text-transform: uppercase; color: rgb(254, 254, 254); white-space: nowrap; }
        .bs-price { font-family: 'Space Mono', monospace; font-size: 13px; color: #f0ede6; white-space: nowrap; }
        @media (min-width: 640px) { .bs-price { font-size: 15px; } }

        .newin-name  { font-family: 'Cormorant Garamond', serif; font-weight: 300; color: #f0ede6; margin: 0 0 4px; line-height: 1.15; font-size: 15px; }
        .newin-cat   { font-family: 'Space Mono', monospace; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(240,237,230,0.6); font-size: 7px; white-space: nowrap; }
        .newin-price { font-family: 'Space Mono', monospace; color: #f0ede6; font-size: 13px; white-space: nowrap; }
        .newin-orig  { font-family: 'Space Mono', monospace; color: rgba(240,237,230,0.45); text-decoration: line-through; font-size: 10.5px; white-space: nowrap; }
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

        /* ── REVIEWS CTA ── */
        .reviews-cta-section { padding: 0 20px 24px; text-align: center; max-width: 100%; }

        /* ── STATEMENT ── */
        .statement-section { padding: 64px 20px; text-align: center; max-width: 100%; overflow: hidden; }
        @media (min-width: 640px) { .statement-section { padding: 80px 24px; } }
        .statement-row { display: flex; align-items: center; gap: 16px; max-width: 600px; margin: 0 auto; }
        .statement-line { flex: 1; height: 1px; background: rgba(240,237,230,0.08); min-width: 12px; }
        .statement-label { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.25em; text-transform: uppercase; color: rgba(240,237,230,0.55); margin-bottom: 16px; }
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
          src={optimizeCloudinaryUrl("https://res.cloudinary.com/ghetnovd/image/upload/2z-store/hero.png", 1200)}
          srcSet={[500, 800, 1200, 1600].map((w) => `${optimizeCloudinaryUrl("https://res.cloudinary.com/ghetnovd/image/upload/2z-store/hero.png", w)} ${w}w`).join(", ")}
          alt="2Z Minimal Streetwear"
          fetchPriority="high"
          loading="eager"
          decoding="sync"
          sizes="100vw"
          className="hero-img"
        />

        <div className="hero-overlay" />

        <div className="hero-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "20px", height: "1px", background: "rgba(200,240,79,0.5)" }} />
            <span style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.6)" }}>
              Egypt · SS26
            </span>
          </div>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: "22px", letterSpacing: "0.02em", color: "#f0ede6" }}>
            2Z
          </span>
        </div>

        <div className="hero-content">
          <h1 className="hero-title">
            2Z Next <br />
            Level
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

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...Array(2)].map((_, repeatIdx) => (
            <span key={repeatIdx} style={{ display: "contents" }}>
              <span className="marquee-item">2Z Store</span>
              <span className="marquee-item">Egypt SS26</span>
              <span className="marquee-item">Minimal Streetwear</span>
              <span className="marquee-item">Oversized Fit</span>
              <span className="marquee-item">Made For Egypt</span>
              <span className="marquee-item">Black · White · Grey · Beige</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── BEST SELLERS ── */}
      <section className="bestsellers-section">
        <RevealSection>
          <div className="newin-header">
            <span className="newin-label">Best Sellers</span>
            <Link href="/products" className="newin-viewall">View All</Link>
          </div>
        </RevealSection>
        <div className="bs-list">
          <Suspense fallback={<BestSellersSkeleton />}>
            <BestSellersSection />
          </Suspense>
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
        <div className="newin-scroll-wrap">
          <div className="newin-grid">
            <Suspense fallback={<NewInSkeleton />}>
              <NewInSection />
            </Suspense>
          </div>
        </div>
        <NewInScrollProgress />
      </section>

      {/* ── REVIEWS ── */}
      <ReviewsGallery />

      {/* ── REVIEWS CTA ── */}
      <section className="reviews-cta-section">
        <RevealSection>
          <Link href="/products" className="shop-btn">Shop Now</Link>
        </RevealSection>
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
              <span style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.6)" }}>Next Drop</span>
              </div>
              <h2 className="shimmer-text">Sweatpants.</h2>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid rgba(240,237,230,0.12)", padding: "9px 16px", width: "fit-content" }}>
              <div className="comingsoon-dot" style={{ width: "4px", height: "4px" }} />
              <span style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.65)" }}>Coming Soon</span>
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
                <img src={cat.img} alt={cat.name} loading="lazy" className="cat-img" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,8,0.9) 0%, transparent 55%)" }} />
                <div style={{ position: "absolute", bottom: "16px", left: "16px" }}>
                  <p style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.6)", marginBottom: "4px" }}>Collection</p>
                  <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: 300, color: "#f0ede6", margin: 0 }}>{cat.name}</p>
                </div>
              </Link>
            ) : (
              <div style={{ position: "relative", height: "180px", overflow: "hidden" }}>
                <img src={cat.img} alt={cat.name} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.1, filter: "grayscale(100%)" }} />
                <div style={{ position: "absolute", bottom: "16px", left: "16px" }}>
                  <p style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.35)", marginBottom: "4px" }}>Coming Soon</p>
                  <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "22px", fontWeight: 300, color: "rgba(240,237,230,0.4)", margin: 0 }}>{cat.name}</p>
                </div>
              </div>
            )}
          </RevealSection>
        ))}
      </section>

      {/* ── FOOTER STRIP ── */}
      <RevealSection>
        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(200,240,79,0.35), transparent)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.5)" }}>2Z — Egypt</span>
          <span style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.5)" }}>Oversized T-Shirts</span>
        </div>
      </RevealSection>

    </div>
  )
}
