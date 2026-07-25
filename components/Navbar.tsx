"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/store/auth"
import { useCart } from "@/lib/store/cart"
import { useRouter } from "next/navigation"

export default function Navbar({ hideAnnouncementOffset = false }: { hideAnnouncementOffset?: boolean } = {}) {
  const { user, logout } = useAuth()
  const { items } = useCart()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <>
      <nav style={{ position: "fixed", top: hideAnnouncementOffset ? 0 : "38px", left: 0, right: 0, zIndex: 50, background: "rgba(8,8,8,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(240,237,230,0.06)" }}>
        <div style={{ padding: "0 20px", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <Link href="/">
            <Image src="/logo.jpeg" alt="2Z" width={36} height={36} priority style={{ objectFit: "cover", borderRadius: "50%", mixBlendMode: "screen" }} />
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: "32px", fontSize: "10px", letterSpacing: "0.2em" }}>
            <Link href="/products" style={{ color: "#f0ede6", textDecoration: "none", textTransform: "uppercase" }}>Shop</Link>
            <Link href="/orders" style={{ color: "#f0ede6", textDecoration: "none", textTransform: "uppercase" }}>Orders</Link>
            {user ? (
              <>
                {user.role === "ADMIN" && (
                  <Link href="/admin" style={{ color: "#f0ede6", textDecoration: "none", textTransform: "uppercase" }}>Admin</Link>
                )}
                <button onClick={() => { logout(); router.push("/") }} style={{ color: "#f0ede6", background: "none", border: "none", cursor: "pointer", fontFamily: "Space Mono, monospace", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" style={{ color: "#f0ede6", textDecoration: "none", textTransform: "uppercase" }}>Login</Link>
            )}
            <Link href="/cart" style={{ color: "#f0ede6", textDecoration: "none", textTransform: "uppercase", position: "relative" }}>
              Cart
              {itemCount > 0 && (
                <span style={{ position: "absolute", top: "-8px", right: "-12px", background: "#f0ede6", color: "#080808", fontSize: "8px", width: "14px", height: "14px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{itemCount}</span>
              )}
            </Link>
          </div>

          {/* Mobile — hamburger only. Cart + Orders live inside the menu, guest or logged in */}
          <div className="flex md:hidden" style={{ alignItems: "center", gap: "16px" }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f0ede6", padding: "4px", position: "relative" }}>
              {menuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
              {itemCount > 0 && !menuOpen && (
                <span style={{ position: "absolute", top: "-2px", right: "-4px", background: "#f0ede6", color: "#080808", fontSize: "8px", width: "13px", height: "13px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{itemCount}</span>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Menu — Cart + Orders live here too, guest or logged in */}
        {menuOpen && (
          <div className="md:hidden" style={{ borderTop: "1px solid rgba(240,237,230,0.06)", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <Link href="/products" onClick={() => setMenuOpen(false)} style={{ color: "#f0ede6", textDecoration: "none", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Shop</Link>
            <Link href="/cart" onClick={() => setMenuOpen(false)} style={{ color: "#f0ede6", textDecoration: "none", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
              Cart
              {itemCount > 0 && (
                <span style={{ background: "#f0ede6", color: "#080808", fontSize: "8px", width: "14px", height: "14px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{itemCount}</span>
              )}
            </Link>
            <Link href="/orders" onClick={() => setMenuOpen(false)} style={{ color: "#f0ede6", textDecoration: "none", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Orders</Link>
            {user ? (
              <>
                {user.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} style={{ color: "#f0ede6", textDecoration: "none", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Admin</Link>
                )}
                <button onClick={() => { logout(); router.push("/"); setMenuOpen(false) }} style={{ color: "#f0ede6", background: "none", border: "none", cursor: "pointer", fontFamily: "Space Mono, monospace", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", textAlign: "left", padding: 0 }}>
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} style={{ color: "#f0ede6", textDecoration: "none", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Login</Link>
            )}
          </div>
        )}
      </nav>
    </>
  )
}