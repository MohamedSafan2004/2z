"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegisterPage() {
  const [name, setName]         = useState("")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone]       = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  const handleRegister = useCallback(async () => {
    if (loading) return
    setError("")

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields")
      return
    }
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (phone && !/^01[0-9]{9}$/.test(phone.trim())) {
      setError("Please enter a valid Egyptian phone number (01XXXXXXXXX)")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Something went wrong"); return }
      router.push(`/verify?userId=${data.userId}`)
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [loading, name, email, password, phone, router])

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    background: "transparent",
    border: "1px solid rgba(240,237,230,0.15)",
    color: "#f0ede6",
    fontFamily: "Space Mono, monospace",
    fontSize: "11px",
    outline: "none",
    boxSizing: "border-box",
  }

  const labelStyle: React.CSSProperties = {
    fontSize: "9px",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "rgba(240,237,230,0.6)",
    marginBottom: "8px",
    display: "block",
  }

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "8px", textAlign: "center" }}>Join 2Z</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "#f0ede6", marginBottom: "12px", textAlign: "center" }}>Create Account</h1>
        <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)", marginBottom: "40px", textAlign: "center", lineHeight: 1.8 }}>
          Track your orders and manage your account.
        </p>

        <div aria-live="polite" aria-atomic="true">
          {error && (
            <p role="alert" style={{ fontSize: "10px", color: "#ff6b6b", marginBottom: "20px", textAlign: "center", letterSpacing: "0.05em" }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="name" style={labelStyle}>Full Name *</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            placeholder="Your name"
            autoComplete="name"
            aria-required="true"
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="email" style={labelStyle}>Email *</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="your@email.com"
            autoComplete="email"
            aria-required="true"
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="password" style={labelStyle}>Password *</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            aria-required="true"
          />
        </div>

        <div style={{ marginBottom: "32px" }}>
          <label htmlFor="phone" style={labelStyle}>Phone <span style={{ color: "rgba(240,237,230,0.3)" }}>(optional)</span></label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            style={inputStyle}
            placeholder="01XXXXXXXXX"
            autoComplete="tel"
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          aria-label="Create account"
          style={{
            width: "100%", padding: "14px", fontSize: "10px",
            letterSpacing: "0.25em", textTransform: "uppercase",
            fontFamily: "Space Mono, monospace", background: "#f0ede6",
            color: "#080808", border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, transition: "all 0.3s", marginBottom: "16px",
          }}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p style={{ textAlign: "center", fontSize: "10px", color: "rgba(240,237,230,0.3)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#f0ede6", textDecoration: "underline" }}>Login</Link>
        </p>

      </div>
    </div>
  )
}