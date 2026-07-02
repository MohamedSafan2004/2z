"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function OrderConfirmedContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const orderId = searchParams.get("id")

  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace", padding: "24px", textAlign: "center" }}>
      <div style={{ width: "64px", height: "64px", border: "1px solid rgba(240,237,230,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.7)" strokeWidth="1.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <p style={{ fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: "8px" }}>Thank you</p>
      <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "36px", fontWeight: 300, color: "#f0ede6", marginBottom: "16px" }}>Order Confirmed</h1>
      <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.5)", lineHeight: 2, marginBottom: "8px" }}>
        Your order has been placed successfully.
      </p>
      {email && (
        <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.5)", lineHeight: 2, marginBottom: "32px" }}>
          A confirmation has been sent to <span style={{ color: "#f0ede6" }}>{email}</span>
        </p>
      )}
      {orderId && (
        <p style={{ fontSize: "9px", color: "rgba(240,237,230,0.3)", marginBottom: "32px", letterSpacing: "0.1em" }}>
          Order #{orderId.slice(0, 8).toUpperCase()}
        </p>
      )}
      <p style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)", lineHeight: 2, marginBottom: "32px" }}>
        Want to track your order?{" "}
        <Link href="/register" style={{ color: "#f0ede6", textDecoration: "underline" }}>Create an account</Link>
        {" "}with the same email.
      </p>
      <Link href="/products" style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#f0ede6", border: "1px solid rgba(240,237,230,0.3)", padding: "12px 24px", textDecoration: "none" }}>
        Continue Shopping
      </Link>
    </div>
  )
}

export default function OrderConfirmedPage() {
  return (
    <Suspense>
      <OrderConfirmedContent />
    </Suspense>
  )
}