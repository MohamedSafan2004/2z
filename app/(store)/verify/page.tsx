"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/store/auth"

function VerifyContent() {
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")
  const router = useRouter()
  const { setAuth } = useAuth()

  const [codes, setCodes] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [resending, setResending] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCodes = [...codes]
    newCodes[index] = value.slice(-1)
    setCodes(newCodes)
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !codes[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newCodes = [...codes]
    pasted.split("").forEach((char, i) => { newCodes[i] = char })
    setCodes(newCodes)
    inputs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleVerify = async () => {
    const code = codes.join("")
    if (code.length !== 6) { setError("Please enter the complete code"); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setAuth(data.user, data.token)
      router.push("/")
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    setResending(true)
    setError("")
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setCountdown(60)
      setCanResend(false)
      setCodes(["", "", "", "", "", ""])
      inputs.current[0]?.focus()
    } catch {
      setError("Something went wrong")
    } finally {
      setResending(false)
    }
  }

  const isComplete = codes.every((c) => c !== "")

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "400px", textAlign: "center" }}>

        <div style={{ width: "64px", height: "64px", margin: "0 auto 24px", border: "1px solid rgba(240,237,230,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.5)" strokeWidth="1.5">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m2 7 10 7 10-7"/>
          </svg>
        </div>

        <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "8px" }}>Check your email</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "32px", fontWeight: 300, color: "#f0ede6", marginBottom: "12px" }}>Verify Email</h1>
        <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.45)", marginBottom: "40px", lineHeight: 1.8 }}>
          We sent a 6-digit code to your email.<br />Enter it below to activate your account.
        </p>

        {error && (
          <p style={{ fontSize: "10px", color: "#ff6b6b", marginBottom: "20px" }}>{error}</p>
        )}

        {/* Code Boxes */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "32px" }}>
          {codes.map((code, index) => (
            <input
              key={index}
              ref={(el) => { inputs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={code}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              style={{
                width: "48px", height: "56px", textAlign: "center",
                fontSize: "20px", fontFamily: "Cormorant Garamond, serif", fontWeight: 300,
                background: "transparent",
                border: code ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.2)",
                color: "#f0ede6", outline: "none", transition: "border 0.2s",
              }}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={!isComplete || loading}
          style={{
            width: "100%", padding: "14px", fontSize: "10px", letterSpacing: "0.25em",
            textTransform: "uppercase", fontFamily: "Space Mono, monospace",
            background: isComplete ? "#f0ede6" : "transparent",
            color: isComplete ? "#080808" : "rgba(240,237,230,0.25)",
            border: isComplete ? "1px solid #f0ede6" : "1px solid rgba(240,237,230,0.15)",
            cursor: isComplete ? "pointer" : "not-allowed",
            opacity: loading ? 0.7 : 1, transition: "all 0.3s",
            marginBottom: "20px",
          }}
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>

        {/* Resend */}
        <div style={{ textAlign: "center" }}>
          {!canResend ? (
            <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.3)", letterSpacing: "0.1em" }}>
              Resend code in <span style={{ color: "#f0ede6" }}>{countdown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase",
                color: resending ? "rgba(240,237,230,0.3)" : "rgba(240,237,230,0.6)",
                fontFamily: "Space Mono, monospace", textDecoration: "underline",
              }}
            >
              {resending ? "Sending..." : "Resend Code"}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  )
}