"use client"

import { useState } from "react"
import Image from "next/image"

export default function ComingSoonPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!email) return
    // هنحفظ الإيميل بعدين
    setSubmitted(true)
  }

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace", padding: "24px", textAlign: "center" }}>

      <img
        src="/logo.jpeg"
        alt="2Z"
        style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "50%", marginBottom: "32px" }}
      />

      <p style={{ fontSize: "9px", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "16px" }}>
        6th of October, Egypt
      </p>

      <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(40px, 8vw, 72px)", fontWeight: 300, color: "#f0ede6", lineHeight: 1.1, marginBottom: "16px" }}>
        Coming<br /><em style={{ color: "rgba(240,237,230,0.5)" }}>Soon.</em>
      </h1>

      <p style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "48px" }}>
        Oversized T-shirts
      </p>

      {!submitted ? (
        <div style={{ width: "100%", maxWidth: "360px" }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.15em", color: "rgba(240,237,230,0.4)", marginBottom: "16px" }}>
            Be the first to know when we launch
          </p>
          <div style={{ display: "flex", gap: "0" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="your@email.com"
              style={{
                flex: 1,
                padding: "12px",
                background: "transparent",
                border: "1px solid rgba(240,237,230,0.15)",
                borderRight: "none",
                color: "#f0ede6",
                fontFamily: "Space Mono, monospace",
                fontSize: "10px",
                outline: "none",
              }}
            />
            <button
              onClick={handleSubmit}
              style={{
                padding: "12px 20px",
                background: "#f0ede6",
                color: "#080808",
                border: "none",
                cursor: "pointer",
                fontFamily: "Space Mono, monospace",
                fontSize: "9px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Notify Me
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.6)", letterSpacing: "0.1em" }}>
            ✓ We'll let you know when we're ready.
          </p>
        </div>
      )}

      <div style={{ position: "absolute", bottom: "24px", display: "flex", gap: "24px" }}>
        <a href="https://www.instagram.com/2z_offical?igsh=MWh3dWZiYWN1ZzdrZA%3D%3D" target="_blank" rel="noopener noreferrer" style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#f0ede6", textDecoration: "none" }}>Instagram</a>
        <a href="https://www.tiktok.com/@2z_offical?_r=1&_t=ZS-96kSCZpQdl3" target="_blank" rel="noopener noreferrer" style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#f0ede6", textDecoration: "none" }}>TikTok</a>
      </div>

    </div>
  )
}