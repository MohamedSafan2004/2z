"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/store/auth"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuth()
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      setAuth(data.user, data.token)
      router.push("/")
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "8px", textAlign: "center" }}>Welcome back</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "#f0ede6", marginBottom: "48px", textAlign: "center" }}>Login</h1>

        {error && (
          <p style={{ fontSize: "10px", color: "#ff6b6b", letterSpacing: "0.1em", marginBottom: "20px", textAlign: "center" }}>{error}</p>
        )}

        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "8px" }}>Email</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "12px", background: "transparent", border: "1px solid rgba(240,237,230,0.15)", color: "#f0ede6", fontFamily: "Space Mono, monospace", fontSize: "11px", outline: "none" }}
          />
        </div>

        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "8px" }}>Password</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "12px", background: "transparent", border: "1px solid rgba(240,237,230,0.15)", color: "#f0ede6", fontFamily: "Space Mono, monospace", fontSize: "11px", outline: "none" }}
          />
        </div>
        <div style={{ textAlign: "right", marginBottom: "24px", marginTop: "-20px" }}>
          <Link href="/forgot-password" style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", textDecoration: "none" }}>
            Forgot Password?
          </Link>
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", padding: "14px", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", background: "#f0ede6", color: "#080808", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "opacity 0.3s" }}
        >
          {loading ? "..." : "Login"}
        </button>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "10px", color: "rgba(240,237,230,0.3)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "#f0ede6", textDecoration: "underline" }}>Register</Link>
        </p>

      </div>
    </div>
  )
}