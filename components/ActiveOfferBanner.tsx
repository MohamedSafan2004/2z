"use client"

// ─────────────────────────────────────────────────────────────────────
// Active offer banner — شريط مشترك بين صفحة المنتج المفرد وصفحة قائمة المنتجات.
// لو الزائر عنده كود 10% شغال (من OfferPopup.tsx) ولسه في الصلاحية، بيظهرله شريط
// يفكرّه بالكود ويدفعه يستخدمه دلوقتي. بيقرا نفس localStorage key (2z_offer_claim)
// اللي بيكتبه OfferPopup — محتاجين نطابق المفتاح والشكل بالظبط.
// ─────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react"

const OFFER_CLAIM_KEY = "2z_offer_claim"
const OFFER_URGENT_THRESHOLD_MS   = 6 * 60 * 60 * 1000 // آخر 6 ساعات
const OFFER_CRITICAL_THRESHOLD_MS = 1 * 60 * 60 * 1000 // آخر ساعة
const ACCENT = "#c8f04f"

type OfferClaim = { code: string; expiresAt: number }

function readOfferClaim(): OfferClaim | null {
  try {
    const raw = localStorage.getItem(OFFER_CLAIM_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OfferClaim
    if (!parsed?.code || !parsed?.expiresAt) return null
    if (parsed.expiresAt <= Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

function formatOfferRemaining(ms: number): string {
  if (ms <= 0) return "Expired"
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours >= 1) return `${hours}h ${minutes}m left`
  if (minutes >= 1) return `${minutes}m left`
  return "under a minute left"
}

export default function ActiveOfferBanner() {
  const [claim, setClaim] = useState<OfferClaim | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [copied, setCopied] = useState(false)

  // بيتقرا بعد الـ mount بس — عشان ميحصلش أي hydration mismatch بين السيرفر والفرونت
  useEffect(() => {
    queueMicrotask(() => setClaim(readOfferClaim()))
  }, [])

  useEffect(() => {
    if (!claim) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [claim])

  useEffect(() => {
    if (!claim) return
    if (claim.expiresAt <= now) {
      queueMicrotask(() => setClaim(null))
    }
  }, [claim, now])

  if (!claim) return null

  const remaining = claim.expiresAt - now
  const level = remaining <= OFFER_CRITICAL_THRESHOLD_MS ? "critical" : remaining <= OFFER_URGENT_THRESHOLD_MS ? "urgent" : "normal"
  const accent = level === "critical" ? "#e05252" : level === "urgent" ? "#e0a052" : ACCENT
  const accentSoft = level === "critical" ? "rgba(224,82,82,0.08)" : level === "urgent" ? "rgba(224,160,82,0.08)" : "rgba(200,240,79,0.06)"
  const border = level === "critical" ? "rgba(224,82,82,0.4)" : level === "urgent" ? "rgba(224,160,82,0.4)" : "rgba(200,240,79,0.3)"

  const handleCopy = () => {
    navigator.clipboard.writeText(claim.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="active-offer-banner"
      style={{ background: accentSoft, borderColor: border }}
    >
      <div className="active-offer-row">
        <span className="active-offer-dot" style={{ background: accent }} />
        <span className="active-offer-text">
          {level === "critical" ? "Your 10% off code expires soon —" : "You've got 10% off waiting —"}
        </span>
        <button onClick={handleCopy} className="active-offer-code" style={{ color: accent, borderColor: border }}>
          {claim.code} {copied ? "✓" : "· copy"}
        </button>
        <span className="active-offer-timer" style={{ color: accent }}>
          {formatOfferRemaining(remaining)}
        </span>
      </div>

      <style jsx>{`
        .active-offer-banner {
          border: 1px solid;
          margin-bottom: 32px;
          padding: 12px 16px;
          animation: activeOfferFadeIn 0.4s ease both;
        }
        .active-offer-row {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
        }
        .active-offer-dot {
          width: 6px; height: 6px; border-radius: 50%;
          flex-shrink: 0;
          animation: activeOfferPulse 1.6s ease-in-out infinite;
        }
        .active-offer-text {
          font-family: 'Space Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.02em;
          color: rgba(240,237,230,0.6);
          white-space: nowrap;
        }
        .active-offer-code {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          background: rgba(8,8,8,0.4);
          border: 1px solid;
          padding: 3px 9px;
          cursor: pointer;
          white-space: nowrap;
        }
        .active-offer-timer {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.04em;
          margin-left: auto;
          white-space: nowrap;
        }
        @keyframes activeOfferPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes activeOfferFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 460px) {
          .active-offer-text { white-space: normal; }
          .active-offer-timer { margin-left: 0; width: 100%; }
        }
      `}</style>
    </div>
  )
}
