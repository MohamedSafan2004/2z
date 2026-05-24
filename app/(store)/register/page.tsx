"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/store/auth"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuth()
  const router = useRouter()

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all required fields")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        return
      }
      router.push(`/verify?userId=${data.userId}`)
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "380px" }}>

        <p style={{ fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "8px", textAlign: "center" }}>Join 2Z</p>
        <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "#f0ede6", marginBottom: "48px", textAlign: "center" }}>Create Account</h1>

        {error && (
          <p style={{ fontSize: "10px", color: "#ff6b6b", letterSpacing: "0.1em", marginBottom: "20px", textAlign: "center" }}>{error}</p>
        )}

        {[
          { label: "Full Name *", value: name, setter: setName, type: "text" },
          { label: "Email *", value: email, setter: setEmail, type: "email" },
          { label: "Password *", value: password, setter: setPassword, type: "password" },
          { label: "Phone", value: phone, setter: setPhone, type: "tel" },
        ].map((field) => (
          <div key={field.label} style={{ marginBottom: "16px" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.4)", marginBottom: "8px" }}>{field.label}</p>
            <input
              type={field.type}
              value={field.value}
              onChange={(e) => field.setter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              style={{ width: "100%", padding: "12px", background: "transparent", border: "1px solid rgba(240,237,230,0.15)", color: "#f0ede6", fontFamily: "Space Mono, monospace", fontSize: "11px", outline: "none" }}
            />
          </div>
        ))}

        <div style={{ marginBottom: "32px" }} />

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{ width: "100%", padding: "14px", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "Space Mono, monospace", background: "#f0ede6", color: "#080808", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "opacity 0.3s" }}
        >
          {loading ? "..." : "Create Account"}
        </button>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "10px", color: "rgba(240,237,230,0.3)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#f0ede6", textDecoration: "underline" }}>Login</Link>
        </p>

      </div>
    </div>
  )
}