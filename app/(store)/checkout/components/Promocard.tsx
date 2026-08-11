"use client"

import { useState, useEffect } from "react"

interface PromoCardProps {
  promoInput: string
  onPromoInputChange: (v: string) => void
  promoApplied: string
  promoDiscount: number
  promoLoading: boolean
  promoError: string
  promoSuccess: string
  onApply: () => void
  onRemove: () => void
}

// دائرة لف بسيطة (CSS-only) بتظهر لحظة ما الطلب يتبعت فعلياً — بديلاً من نص
// "..." اللي مش واضح إن فيه حاجة بتحصل فعليًا
function Spinner() {
  return (
    <span
      style={{
        display: "inline-block", width: "14px", height: "14px",
        border: "1.5px solid rgba(240,237,230,0.25)", borderTopColor: "#f0ede6",
        borderRadius: "50%", animation: "promo-spin 0.6s linear infinite",
      }}
    />
  )
}

export default function PromoCard({
  promoInput, onPromoInputChange, promoApplied, promoDiscount,
  promoLoading, promoError, promoSuccess, onApply, onRemove,
}: PromoCardProps) {
  // بيتحول true لحظة ما يتقبل الكود، وبيتفعّل الـ checkmark الحركة مرة واحدة بس
  const [justApplied, setJustApplied] = useState(false)
  // بيتحول true لحظة ما ييجي error جديد — بيشغّل الـ shake animation لمدة قصيرة بس
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (promoApplied) {
      setJustApplied(true)
      const t = setTimeout(() => setJustApplied(false), 700)
      return () => clearTimeout(t)
    }
  }, [promoApplied])

  useEffect(() => {
    if (promoError) {
      setShake(true)
      const t = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(t)
    }
  }, [promoError])

  const sharedStyles = (
    <style>{`
      @keyframes promo-spin { to { transform: rotate(360deg); } }
      @keyframes promo-check-in {
        0% { transform: scale(0); opacity: 0; }
        60% { transform: scale(1.15); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes promo-shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(5px); }
        60% { transform: translateX(-3px); }
        80% { transform: translateX(2px); }
      }
      .promo-checkmark { animation: promo-check-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .promo-shake-target { animation: promo-shake 0.45s ease; }
    `}</style>
  )

  if (!promoApplied) {
    return (
      <div>
        {sharedStyles}
        <div
          className={shake ? "promo-shake-target" : undefined}
          style={{ display: "flex", gap: "10px" }}
        >
          <input
            type="text"
            value={promoInput}
            onChange={(e) => onPromoInputChange(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && onApply()}
            placeholder="Enter code"
            disabled={promoLoading}
            style={{
              flex: 1, height: "54px", padding: "0 16px",
              background: "rgba(255,255,255,0.02)",
              border: `1.5px solid ${promoError ? "rgba(255,107,107,0.5)" : "rgba(240,237,230,0.14)"}`,
              borderRadius: "14px", color: "#f0ede6", fontFamily: "Space Mono, monospace",
              fontSize: "14.5px", outline: "none", letterSpacing: "0.05em",
              transition: "border-color 0.25s ease",
            }}
          />
          <button
            onClick={onApply}
            disabled={promoLoading}
            style={{
              height: "54px", width: "84px", padding: "0", borderRadius: "14px",
              background: "rgba(240,237,230,0.08)", border: "1.5px solid rgba(240,237,230,0.14)",
              color: "#f0ede6", display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Space Mono, monospace", fontSize: "12px", letterSpacing: "0.05em",
              cursor: promoLoading ? "not-allowed" : "pointer", whiteSpace: "nowrap",
              opacity: promoLoading ? 0.6 : 1, transition: "opacity 0.2s ease",
            }}
          >
            {promoLoading ? <Spinner /> : "Apply"}
          </button>
        </div>
        {promoError && <p style={{ fontSize: "10.5px", color: "#ff6b6b", marginTop: "10px", letterSpacing: "0.05em" }}>{promoError}</p>}
      </div>
    )
  }

  return (
    <div>
      {sharedStyles}
      <div
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 16px", borderRadius: "14px",
          background: justApplied ? "rgba(200,240,79,0.08)" : "rgba(240,237,230,0.06)",
          border: `1.5px solid ${justApplied ? "rgba(200,240,79,0.5)" : "rgba(240,237,230,0.3)"}`,
          transition: "background 0.4s ease, border-color 0.4s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            className={justApplied ? "promo-checkmark" : undefined}
            style={{
              width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
              background: "#c8f04f", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
              <path d="M5 13l4 4L19 7" stroke="#080808" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <p style={{ fontSize: "13px", color: "rgba(240,237,230,0.9)", letterSpacing: "0.05em" }}>{promoApplied}</p>
            <p style={{ fontSize: "10.5px", color: "rgba(200,240,79,0.75)", marginTop: "2px" }}>{promoDiscount}% off applied</p>
          </div>
        </div>
        <button onClick={onRemove} style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Space Mono, monospace", letterSpacing: "0.05em" }}>
          Remove
        </button>
      </div>
    </div>
  )
}