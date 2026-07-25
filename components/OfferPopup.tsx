"use client"

import { useState, useEffect, useCallback } from "react"
import { trackLead, generateEventId } from "@/lib/meta-pixel"

const STORAGE_KEY = "2z_offer_popup_dismissed"
const SHOW_DELAY_MS = 4000
const COUNTDOWN_SECONDS = 30

type Stage = "hidden" | "offer" | "success"

export default function OfferPopup() {
  const [stage, setStage] = useState<Stage>("hidden")
  const [visible, setVisible] = useState(false) // بيتحكم في الـ slide animation
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [promoCode, setPromoCode] = useState("")
  const [copied, setCopied] = useState(false)

  const dismiss = useCallback(() => {
    setVisible(false)
    setTimeout(() => setStage("hidden"), 300) // ننتظر الـ slide-out animation
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // localStorage ممكن يكون معطل — مش مشكلة، هيظهر تاني بس
    }
  }, [])

  // ── ظهور الكارت بعد تأخير بسيط، مرة واحدة بس لكل زائر ──
  useEffect(() => {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      // تجاهل
    }
    if (dismissed) return

    const timer = setTimeout(() => {
      setStage("offer")
      requestAnimationFrame(() => setVisible(true))
    }, SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  // ── عداد الـ 30 ثانية ──
  useEffect(() => {
    if (stage !== "offer") return
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [stage])

  useEffect(() => {
    if (stage === "offer" && secondsLeft === 0) {
      queueMicrotask(() => dismiss())
    }
  }, [stage, secondsLeft, dismiss])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError("")

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("اكتب إيميل صحيح")
      return
    }

    setLoading(true)
    const eventId = generateEventId()

    try {
      const res = await fetch("/api/leads/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, eventId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "حصل خطأ، جرب تاني")
        setLoading(false)
        return
      }

      trackLead({ eventId })
      setPromoCode(data.promoCode)
      setStage("success")
      try {
        localStorage.setItem(STORAGE_KEY, "1")
      } catch {
        // تجاهل
      }
    } catch {
      setError("حصل خطأ في الاتصال، جرب تاني")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(promoCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (stage === "hidden") return null

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        zIndex: 150,
        width: "100%",
        maxWidth: "320px",
        background: "#0d0d0d",
        border: "1px solid rgba(240,237,230,0.14)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        padding: "22px 20px 18px",
        transform: visible ? "translateX(0)" : "translateX(-120%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
      }}
    >
      <button
        onClick={dismiss}
        aria-label="Close"
        style={{
          position: "absolute", top: "10px", right: "10px",
          width: "22px", height: "22px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(240,237,230,0.4)", fontSize: "16px", lineHeight: 1,
        }}
      >
        ×
      </button>

      {stage === "offer" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <p style={{ fontSize: "8.5px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", margin: 0 }}>
              2Z Exclusive
            </p>
            <span style={{ flex: 1, height: "1px", background: "rgba(240,237,230,0.1)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{
                width: "5px", height: "5px", borderRadius: "50%",
                background: secondsLeft <= 10 ? "#e05252" : "#c8f04f",
                animation: "offerPulse 1s ease-in-out infinite",
              }} />
              <span style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.02em",
                color: secondsLeft <= 10 ? "#e05252" : "#f0ede6",
                minWidth: "26px",
              }}>
                0:{secondsLeft.toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "26px", fontWeight: 300, color: "#f0ede6", lineHeight: 1.1, marginBottom: "6px" }}>
            Get <span style={{ color: "#c8f04f" }}>10% Off</span>
          </p>
          <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.5)", lineHeight: 1.6, marginBottom: "16px", letterSpacing: "0.02em" }}>
            Drop your email for an instant discount code.
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(240,237,230,0.04)",
                border: "1px solid rgba(240,237,230,0.15)",
                color: "#f0ede6",
                fontSize: "11.5px", fontFamily: "Space Mono, monospace",
                padding: "10px 12px",
                marginBottom: "8px",
                outline: "none",
              }}
            />
            {error && (
              <p style={{ fontSize: "9.5px", color: "#e05252", marginBottom: "8px", letterSpacing: "0.02em" }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: "#f0ede6", color: "#080808",
                border: "none",
                fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700,
                padding: "11px",
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "..." : "Get My Code"}
            </button>
          </form>
        </>
      )}

      {stage === "success" && (
        <>
          <p style={{ fontSize: "8.5px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "10px" }}>
            You&apos;re In
          </p>

          <button
            onClick={handleCopy}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(200,240,79,0.08)",
              border: "1px solid rgba(200,240,79,0.4)",
              padding: "12px 14px",
              marginBottom: "10px",
              cursor: "pointer",
            }}
          >
            <span style={{ fontFamily: "Space Mono, monospace", fontSize: "14px", letterSpacing: "0.1em", color: "#c8f04f", fontWeight: 700 }}>
              {promoCode}
            </span>
            <span style={{ fontSize: "8.5px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,237,230,0.5)" }}>
              {copied ? "Copied ✓" : "Copy"}
            </span>
          </button>

          <p style={{ fontSize: "9.5px", color: "rgba(240,237,230,0.5)", lineHeight: 1.6 }}>
            Apply at checkout for 10% off.
          </p>
        </>
      )}

      <style jsx>{`
        @keyframes offerPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
