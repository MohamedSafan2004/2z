"use client"

import { useState, useEffect, useCallback } from "react"
import { trackLead, generateEventId } from "@/lib/meta-pixel"

const DISMISSED_KEY   = "2z_offer_popup_dismissed" // العميل قفل الكارت قبل ما ياخد كود — منظهرهولوش تاني
const CLAIM_KEY        = "2z_offer_claim"            // { code, expiresAt } — الكود اللي خده + معاد انتهاءه
const SHOW_DELAY_MS    = 4000
const OFFER_COUNTDOWN_SECONDS = 30 // عداد مرحلة الـ "offer" (قبل ما ياخد الكود) — لسه بيدفعه يتصرف بسرعة

// ── حدود التصعيد (urgency curve) — كل ما الوقت يقرب يخلص، الرسالة والألوان تتغير ──
const URGENT_THRESHOLD_MS   = 6 * 60 * 60 * 1000  // آخر 6 ساعات
const CRITICAL_THRESHOLD_MS = 1 * 60 * 60 * 1000  // آخر ساعة

type Stage = "hidden" | "offer" | "success" | "reminder"
type UrgencyLevel = "normal" | "urgent" | "critical"

type Claim = { code: string; expiresAt: number }

function readClaim(): Claim | null {
  try {
    const raw = localStorage.getItem(CLAIM_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Claim
    if (!parsed?.code || !parsed?.expiresAt) return null
    if (parsed.expiresAt <= Date.now()) return null // انتهت الصلاحية — كأنه مش موجود
    return parsed
  } catch {
    return null
  }
}

function writeClaim(claim: Claim) {
  try {
    localStorage.setItem(CLAIM_KEY, JSON.stringify(claim))
  } catch {
    // localStorage ممكن يكون معطل — مش مشكلة، هيفضل شغال بس من غير تذكير بعد الريفريش
  }
}

function getUrgencyLevel(remainingMs: number): UrgencyLevel {
  if (remainingMs <= CRITICAL_THRESHOLD_MS) return "critical"
  if (remainingMs <= URGENT_THRESHOLD_MS) return "urgent"
  return "normal"
}

// ── ألوان حسب مستوى الـ urgency — نفس نظام الألوان بتاع البراند (ليموني/أحمر) بس بيتصاعد ──
const URGENCY_COLORS: Record<UrgencyLevel, { accent: string; accentSoft: string; border: string }> = {
  normal:   { accent: "#c8f04f", accentSoft: "rgba(200,240,79,0.08)",  border: "rgba(200,240,79,0.35)" },
  urgent:   { accent: "#e0a052", accentSoft: "rgba(224,160,82,0.1)",   border: "rgba(224,160,82,0.45)" },
  critical: { accent: "#e05252", accentSoft: "rgba(224,82,82,0.12)",  border: "rgba(224,82,82,0.55)" },
}

// ── نص العرض بالساعات/الدقايق — أسهل يتقرا من hh:mm:ss خالص في السياق الترويجي ──
function formatFriendlyRemaining(ms: number): string {
  if (ms <= 0) return "Expired"
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours >= 1) return `${hours}h ${minutes}m left`
  if (minutes >= 1) return `${minutes}m left`
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${seconds}s left`
}

// ── نص العد التنازلي الدقيق (hh:mm:ss) — للحظات الحرجة اللي محتاجة إحساس فوري ──
function formatPreciseRemaining(ms: number): string {
  if (ms <= 0) return "0:00:00"
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

// ── رسالة تسويقية حسب مستوى الـ urgency — مش نص وظيفي، ده copy بيدفع لفعل ──
function urgencyHeadline(level: UrgencyLevel): string {
  if (level === "critical") return "Final call —"
  if (level === "urgent") return "Going fast —"
  return "Still active —"
}

export default function OfferPopup() {
  const [stage, setStage] = useState<Stage>("hidden")
  const [visible, setVisible] = useState(false) // بيتحكم في الـ slide animation للكارت الكبير
  const [secondsLeft, setSecondsLeft] = useState(OFFER_COUNTDOWN_SECONDS)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [promoCode, setPromoCode] = useState("")
  const [copied, setCopied] = useState(false)

  // ── الـ claim الحالي (لو العميل خد كود قبل كده ولسه في الـ48 ساعة) ──
  const [claim, setClaim] = useState<Claim | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const dismiss = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      // لو خد كود فعلاً، اتنقل لمرحلة التذكير الدائم بدل الاختفاء الكامل
      setStage(readClaim() ? "reminder" : "hidden")
    }, 300)
    try {
      localStorage.setItem(DISMISSED_KEY, "1")
    } catch {
      // تجاهل
    }
  }, [])

  // ── ظهور الكارت بعد تأخير بسيط، مرة واحدة بس لكل زائر — إلا لو عنده كود شغال بالفعل ──
  useEffect(() => {
    const existingClaim = readClaim()
    if (existingClaim) {
      queueMicrotask(() => {
        setClaim(existingClaim)
        setStage("reminder")
      })
      return
    }

    let dismissed = false
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === "1"
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

  // ── عداد الـ 30 ثانية بتاع مرحلة الـ "offer" (قبل ما ياخد الكود) ──
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

  // ── ساعة حائط تشتغل كل ثانية طول ما فيه claim فعّال — بتغذي كل الـ countdowns ──
  useEffect(() => {
    if (!claim) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [claim])

  // ── لو الصلاحية خلصت وإحنا في "success" أو "reminder"، ارجع للحالة العادية ──
  useEffect(() => {
    if (!claim) return
    if (claim.expiresAt <= now) {
      queueMicrotask(() => {
        setClaim(null)
        setStage("hidden")
      })
      try {
        localStorage.removeItem(CLAIM_KEY)
      } catch {
        // تجاهل
      }
    }
  }, [claim, now])

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

      const expiresAt = data.expiresAt ? new Date(data.expiresAt).getTime() : Date.now() + 48 * 60 * 60 * 1000
      const newClaim: Claim = { code: data.promoCode, expiresAt }
      writeClaim(newClaim)
      setClaim(newClaim)
      setNow(Date.now())

      setStage("success")
      try {
        localStorage.setItem(DISMISSED_KEY, "1")
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

  const openReminderCard = () => {
    setStage("success")
    setVisible(true)
  }

  const closeToReminder = () => {
    setVisible(false)
    setTimeout(() => setStage("reminder"), 300)
  }

  if (stage === "hidden") return null

  // ─────────────────────────────────────────────────────────────────────
  // مرحلة التذكير — badge طافي في الركن، بيتصاعد بصريًا كل ما الوقت يقرب يخلص
  // ─────────────────────────────────────────────────────────────────────
  if (stage === "reminder" && claim) {
    const remaining = claim.expiresAt - now
    const level = getUrgencyLevel(remaining)
    const colors = URGENCY_COLORS[level]
    const isCritical = level === "critical"

    return (
      <button
        onClick={openReminderCard}
        aria-label="Your 10% off code is still active — tap to view"
        className={`offer-reminder-pill ${isCritical ? "offer-reminder-pill--critical" : ""}`}
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          zIndex: 150,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#0d0d0d",
          border: `1.5px solid ${colors.border}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${colors.accentSoft}`,
          padding: "11px 16px 11px 12px",
          cursor: "pointer",
          fontFamily: "Space Mono, monospace",
        }}
      >
        {/* أيقونة تاج/نار بصرية بدل النقطة العادية — أكتر جذب للعين */}
        <span style={{
          width: "22px", height: "22px", borderRadius: "50%",
          background: colors.accentSoft,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          animation: isCritical ? "offerShake 1.2s ease-in-out infinite" : undefined,
        }}>
          <span style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: colors.accent,
            animation: "offerPulse 1.4s ease-in-out infinite",
          }} />
        </span>

        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "1px" }}>
          <span className="offer-reminder-headline" style={{
            fontSize: "8.5px", letterSpacing: "0.1em", textTransform: "uppercase",
            color: colors.accent, fontWeight: 700,
          }}>
            {isCritical ? "Code expires soon!" : "10% off still yours"}
          </span>
          <span style={{
            fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.02em",
            color: "#f0ede6",
          }}>
            {formatFriendlyRemaining(remaining)}
          </span>
        </span>

        <style jsx>{`
          @keyframes offerPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.85); }
          }
          @keyframes offerShake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-8deg); }
            75% { transform: rotate(8deg); }
          }
          .offer-reminder-pill {
            animation: reminderFadeIn 0.4s ease both;
            transition: transform 0.2s ease;
          }
          .offer-reminder-pill:hover {
            transform: translateY(-2px);
          }
          .offer-reminder-pill--critical {
            animation: reminderFadeIn 0.4s ease both, criticalGlow 1.6s ease-in-out infinite;
          }
          @keyframes criticalGlow {
            0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(224,82,82,0.12); }
            50%      { box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 4px rgba(224,82,82,0.18); }
          }
          @keyframes reminderFadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 420px) {
            .offer-reminder-headline { display: none; }
          }
        `}</style>
      </button>
    )
  }

  // ─────────────────────────────────────────────────────────────────────
  // الكارت الكبير — offer / success
  // ─────────────────────────────────────────────────────────────────────
  const remainingForSuccess = claim ? claim.expiresAt - now : 0
  const successLevel = getUrgencyLevel(remainingForSuccess)
  const successColors = URGENCY_COLORS[successLevel]

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
        onClick={stage === "success" ? closeToReminder : dismiss}
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
            Drop your email for an instant code — yours to use for the next 48 hours only.
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <p style={{ fontSize: "8.5px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", margin: 0 }}>
              You&apos;re In
            </p>
            <span style={{ flex: 1, height: "1px", background: "rgba(240,237,230,0.1)" }} />
          </div>

          {claim && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: successColors.accentSoft,
              border: `1px solid ${successColors.border}`,
              padding: "9px 12px",
              marginBottom: "12px",
            }}>
              <span style={{ fontSize: "9px", letterSpacing: "0.04em", color: "rgba(240,237,230,0.65)" }}>
                {urgencyHeadline(successLevel)} <strong style={{ color: successColors.accent }}>expires soon</strong>
              </span>
              <span style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.02em",
                color: successColors.accent,
              }}>
                {successLevel === "critical" ? formatPreciseRemaining(remainingForSuccess) : formatFriendlyRemaining(remainingForSuccess)}
              </span>
            </div>
          )}

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

          <p style={{ fontSize: "9.5px", color: "rgba(240,237,230,0.5)", lineHeight: 1.6, marginBottom: "14px" }}>
            Apply it at checkout — once it&apos;s gone, it&apos;s gone.
          </p>

          <button
            onClick={closeToReminder}
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid rgba(240,237,230,0.15)",
              color: "rgba(240,237,230,0.6)",
              fontSize: "8.5px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700,
              padding: "9px",
              cursor: "pointer",
            }}
          >
            Keep Shopping
          </button>
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
