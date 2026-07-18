"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [resending, setResending] = useState(false)
  const router = useRouter()
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      if (redirectTimer.current) clearTimeout(redirectTimer.current)
    }
  }, [])

  useEffect(() => {
    if (step !== "reset") return
    if (countdown <= 0) return
    const timer = setTimeout(() => {
      if (!isMounted.current) return
      setCountdown((c) => {
        const next = c - 1
        if (next <= 0) setCanResend(true)
        return next
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [countdown, step])

  const handleSendCode = useCallback(async () => {
    if (loading) return
    if (!email.trim()) { setError("Please enter your email"); return }
    setLoading(true)
    setError("")
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      // منع email enumeration — دايما نبين نفس الـ message
      if (isMounted.current) {
        setStep("reset")
        setCountdown(60)
        setCanResend(false)
      }
    } catch {
      if (isMounted.current) setError("Something went wrong")
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [email, loading])

  const handleResendReset = useCallback(async () => {
    if (!canResend || resending) return
    setResending(true)
    setError("")
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (isMounted.current) {
        setCountdown(60)
        setCanResend(false)
        setCode("")
      }
    } catch {
      if (isMounted.current) setError("Something went wrong")
    } finally {
      if (isMounted.current) setResending(false)
    }
  }, [canResend, resending, email])

  const handleReset = useCallback(async () => {
    if (loading) return
    if (!code || !newPassword || !confirmPassword) {
      setError("Please fill in all fields"); return
    }
    if (!/^\d{6}$/.test(code)) {
      setError("Code must be 6 digits"); return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match"); return
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters"); return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (isMounted.current) setError(data.error)
        return
      }
      if (isMounted.current) {
        setSuccess(true)
        redirectTimer.current = setTimeout(() => {
          if (isMounted.current) router.push("/login")
        }, 2000)
      }
    } catch {
      if (isMounted.current) setError("Something went wrong")
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [loading, code, newPassword, confirmPassword, email, router])

  const inputStyle = {
    width: "100%",
    padding: "12px",
    background: "transparent",
    border: "1px solid rgba(240,237,230,0.15)",
    color: "#f0ede6",
    fontFamily: "Space Mono, monospace",
    fontSize: "11px",
    outline: "none",
    boxSizing: "border-box" as const,
  }

  const labelStyle = {
    fontSize: "9px",
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: "rgba(240,237,230,0.6)",
    marginBottom: "8px",
    display: "block",
  }

  if (success) return (
    <div role="alert" aria-live="polite" style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace", padding: "24px" }}>
      <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.6)", marginBottom: "8px" }}>✓ Password reset successfully</p>
      <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.3)" }}>Redirecting to login...</p>
    </div>
  )

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>

        {step === "email" ? (
          <>
            <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "8px", textAlign: "center" }}>Account Recovery</p>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "#f0ede6", marginBottom: "12px", textAlign: "center" }}>Forgot Password</h1>
            <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)", marginBottom: "40px", textAlign: "center", lineHeight: 1.8 }}>
              Enter your email and we&apos;ll send you a reset code.
            </p>

            <div aria-live="polite" aria-atomic="true">
              {error && <p role="alert" style={{ fontSize: "10px", color: "#ff6b6b", marginBottom: "20px", textAlign: "center" }}>{error}</p>}
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label htmlFor="email" style={labelStyle}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                style={inputStyle}
                placeholder="your@email.com"
                autoComplete="email"
                aria-label="Email address"
                aria-required="true"
              />
            </div>

            <button
              onClick={handleSendCode}
              disabled={loading}
              aria-label="Send reset code"
              style={{ width: "100%", padding: "14px", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", background: "#f0ede6", color: "#080808", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.3s", marginBottom: "16px" }}
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>

            <p style={{ textAlign: "center", fontSize: "10px", color: "rgba(240,237,230,0.3)" }}>
              <Link href="/login" style={{ color: "#f0ede6", textDecoration: "underline" }}>Back to Login</Link>
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "8px", textAlign: "center" }}>Check your email</p>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "#f0ede6", marginBottom: "12px", textAlign: "center" }}>Reset Password</h1>
            <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)", marginBottom: "40px", textAlign: "center", lineHeight: 1.8 }}>
              Enter the 6-digit code sent to your email
            </p>

            <div aria-live="polite" aria-atomic="true">
              {error && <p role="alert" style={{ fontSize: "10px", color: "#ff6b6b", marginBottom: "20px", textAlign: "center" }}>{error}</p>}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="code" style={labelStyle}>Reset Code</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setCode(val)
                }}
                style={inputStyle}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                aria-label="6-digit reset code"
                aria-required="true"
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label htmlFor="newPassword" style={labelStyle}>New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={inputStyle}
                autoComplete="new-password"
                aria-label="New password"
                aria-required="true"
              />
            </div>

            <div style={{ marginBottom: "32px" }}>
              <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                style={inputStyle}
                autoComplete="new-password"
                aria-label="Confirm new password"
                aria-required="true"
              />
            </div>

            <button
              onClick={handleReset}
              disabled={loading}
              aria-label="Reset password"
              style={{ width: "100%", padding: "14px", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", background: "#f0ede6", color: "#080808", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "all 0.3s", marginBottom: "20px" }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <div style={{ textAlign: "center" }}>
              {!canResend ? (
                <p aria-live="polite" style={{ fontSize: "10px", color: "rgba(240,237,230,0.3)", letterSpacing: "0.1em" }}>
                  Resend code in <span style={{ color: "#f0ede6" }}>{countdown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendReset}
                  disabled={resending}
                  aria-label="Resend reset code"
                  style={{ background: "none", border: "none", cursor: resending ? "not-allowed" : "pointer", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: resending ? "rgba(240,237,230,0.3)" : "rgba(240,237,230,0.6)", fontFamily: "Space Mono, monospace", textDecoration: "underline" }}
                >
                  {resending ? "Sending..." : "Resend Code"}
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}