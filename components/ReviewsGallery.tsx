"use client"

import { useRef } from "react"
import { RevealSection } from "@/components/RevealSection"

// اتربعت على Cloudinary من prisma/upload-reviews.ts
const REVIEWS = [
  { id: "review-1", w: 1079, h: 949 },
  { id: "review-2", w: 1080, h: 804 },
  { id: "review-3", w: 1080, h: 621 },
  { id: "review-4", w: 1080, h: 626 },
  { id: "review-5", w: 1080, h: 853 },
  { id: "review-6", w: 1080, h: 1001 },
  { id: "review-7", w: 1080, h: 896 },
]

function cloudinaryUrl(id: string, width: number) {
  return `https://res.cloudinary.com/ghetnovd/image/upload/f_auto,q_auto,w_${width}/2z-store/reviews/${id}.jpg`
}

export function ReviewsGallery() {
  const trackRef = useRef<HTMLDivElement>(null)

  return (
    <section className="reviews-section">
      <style>{`
        .reviews-section {
          padding: 64px 20px 72px;
          max-width: 100%;
          overflow: hidden;
        }
        @media (min-width: 640px) {
          .reviews-section { padding: 80px 24px 88px; }
        }

        .reviews-header { margin-bottom: 28px; }
        .reviews-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #f0ede6;
          display: block;
          margin-bottom: 10px;
        }
        .reviews-heading {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: 26px;
          line-height: 1.15;
          color: #f0ede6;
          margin: 0;
        }
        @media (min-width: 480px) { .reviews-heading { font-size: 32px; } }
        @media (min-width: 640px) { .reviews-heading { font-size: 40px; } }
        .reviews-heading em {
          font-style: normal;
          color: rgba(240,237,230,0.38);
        }

        /* ── MOBILE: horizontal snap scroll ── */
        .reviews-track {
          display: flex;
          gap: 14px;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding: 8px 4px 20px;
          margin: 0 -4px;
          scrollbar-width: none;
        }
        .reviews-track::-webkit-scrollbar { display: none; }

        .review-card {
          flex: 0 0 auto;
          width: 76vw;
          max-width: 320px;
          scroll-snap-align: center;
          border-radius: 22px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(240,237,230,0.12);
          background: rgba(240,237,230,0.02);
          box-shadow: 0 12px 32px rgba(0,0,0,0.35);
          transition: transform 0.35s ease, border-color 0.35s ease;
        }
        .review-card img {
          display: block;
          width: 100%;
          height: auto;
        }

        /* active snapped card feels slightly larger on mobile */
        .reviews-track:active .review-card { transform: scale(0.99); }

        @media (min-width: 900px) {
          /* ── DESKTOP: masonry via CSS columns, Pinterest-style ── */
          .reviews-track {
            display: block;
            column-count: 3;
            column-gap: 18px;
            overflow: visible;
            padding: 8px 0 0;
            margin: 0;
          }
          .review-card {
            width: 100%;
            max-width: none;
            margin: 0 0 18px;
            break-inside: avoid;
            cursor: default;
          }
          .review-card:hover {
            transform: translateY(-6px) scale(1.015);
            border-color: rgba(240,237,230,0.28);
            box-shadow: 0 24px 48px rgba(0,0,0,0.5);
          }
          .review-card:hover::after { opacity: 1; }

          /* subtle organic rotation, alternating, not robotic */
          .review-card:nth-child(3n+1) { transform: rotate(-1.1deg); }
          .review-card:nth-child(3n+2) { transform: rotate(0.8deg); }
          .review-card:nth-child(3n)   { transform: rotate(-0.4deg); }
          .review-card:nth-child(3n+1):hover { transform: rotate(-1.1deg) translateY(-6px) scale(1.015); }
          .review-card:nth-child(3n+2):hover { transform: rotate(0.8deg) translateY(-6px) scale(1.015); }
          .review-card:nth-child(3n):hover   { transform: rotate(-0.4deg) translateY(-6px) scale(1.015); }
        }

        @media (min-width: 1200px) {
          .reviews-track { column-count: 4; }
        }

        /* glass hover sheen, desktop only */
        .review-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(240,237,230,0.08) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
        }

        .reviews-hint {
          font-family: 'Space Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(240,237,230,0.25);
          margin-top: 4px;
        }
        @media (min-width: 900px) { .reviews-hint { display: none; } }
      `}</style>

      <RevealSection>
        <div className="reviews-header">
          <span className="reviews-label">From Our Customers</span>
          <h2 className="reviews-heading">
            Customer Reviews ⭐⭐
          </h2>
        </div>
      </RevealSection>

      <RevealSection delay={100}>
        <div className="reviews-track" ref={trackRef}>
          {REVIEWS.map((r) => (
            <div className="review-card" key={r.id}>
              <img
                src={cloudinaryUrl(r.id, 640)}
                srcSet={`${cloudinaryUrl(r.id, 480)} 480w, ${cloudinaryUrl(r.id, 640)} 640w, ${cloudinaryUrl(r.id, 960)} 960w`}
                sizes="(min-width: 900px) 30vw, 76vw"
                alt="2Z customer review"
                loading="lazy"
                width={r.w}
                height={r.h}
              />
            </div>
          ))}
        </div>
        <p className="reviews-hint">Swipe →</p>
      </RevealSection>
    </section>
  )
}
