"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/store/auth"
import { useCart } from "@/lib/store/cart"
import { useRouter } from "next/navigation"

const ACCENT = "#c8f04f"

// أيقونة كارت مرسومة يدوي بنفس أسلوب stroke رفيع زي أزرار الصور في صفحة
// المنتج (img-nav-btn) — مش أيقونة مكتبة جاهزة
function CartIcon({ size = 19 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

// رابط نافبار بخط lime تحته لو هو الصفحة الحالية — بدل تغيير لون بسيط،
// نفس منطق .tier-progress-fill و.hero-divider في باقي الموقع
function NavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === href
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        color: "#f0ede6",
        textDecoration: "none",
        textTransform: "uppercase",
        position: "relative",
        paddingBottom: "4px",
      }}
    >
      {children}
      {isActive && (
        <span style={{ position: "absolute", bottom: "-1px", left: 0, width: "100%", height: "1px", background: ACCENT }} />
      )}
    </Link>
  )
}

export default function Navbar({ hideAnnouncementOffset = false }: { hideAnnouncementOffset?: boolean } = {}) {
  const { user, logout } = useAuth()
  const { items } = useCart()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <>
      <nav className="navbar-blur" style={{ position: "fixed", top: hideAnnouncementOffset ? 0 : "38px", left: 0, right: 0, zIndex: 50, background: "rgba(8,8,8,0.92)", borderBottom: "1px solid rgba(240,237,230,0.06)" }}>
        <div style={{ padding: "0 20px", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <Link href="/">
            <Image src="/logo.jpeg" alt="2Z" width={36} height={36} priority style={{ objectFit: "cover", borderRadius: "50%", mixBlendMode: "screen" }} />
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: "32px", fontSize: "10px", letterSpacing: "0.2em" }}>
            <NavLink href="/products">Shop</NavLink>
            <NavLink href="/orders">Orders</NavLink>
            {user ? (
              <>
                {user.role === "ADMIN" && (
                  <NavLink href="/admin">Admin</NavLink>
                )}
                <button onClick={() => { logout(); router.push("/") }} style={{ color: "#f0ede6", background: "none", border: "none", cursor: "pointer", fontFamily: "Space Mono, monospace", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                  Logout
                </button>
              </>
            ) : (
              <NavLink href="/login">Login</NavLink>
            )}
            <Link href="/cart" aria-label="Cart" style={{ color: "#f0ede6", textDecoration: "none", position: "relative", display: "flex", alignItems: "center" }}>
              <CartIcon />
              {itemCount > 0 && (
                <span style={{ position: "absolute", top: "-9px", right: "-11px", minWidth: "15px", height: "15px", padding: "0 3px", background: ACCENT, color: "#141c05", fontSize: "8px", fontWeight: 700, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{itemCount}</span>
              )}
            </Link>
          </div>

          {/* Mobile — cart icon + menu trigger. Orders/Admin/Login live inside the menu */}
          <div className="flex md:hidden" style={{ alignItems: "center", gap: "18px" }}>
            <Link href="/cart" aria-label="Cart" style={{ color: "#f0ede6", textDecoration: "none", position: "relative", display: "flex", alignItems: "center" }}>
              <CartIcon size={18} />
              {itemCount > 0 && (
                <span style={{ position: "absolute", top: "-8px", right: "-10px", minWidth: "14px", height: "14px", padding: "0 3px", background: ACCENT, color: "#141c05", fontSize: "8px", fontWeight: 700, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{itemCount}</span>
              )}
            </Link>

            {/* Menu trigger — خطين (طويل أبيض + قصير lime) بدل 3 خطوط عادية،
                تصغير لفكرة .hero-divider (خط lime قصير) كعنصر تفاعلي */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-end" }}
            >
              <span style={{
                display: "block", height: "1px", background: "#f0ede6",
                width: menuOpen ? "18px" : "18px",
                transform: menuOpen ? "rotate(45deg) translate(2px, 2px)" : "none",
                transition: "transform 0.25s ease, width 0.25s ease",
              }} />
              <span style={{
                display: "block", height: "1px",
                background: menuOpen ? "#f0ede6" : ACCENT,
                width: menuOpen ? "18px" : "11px",
                transform: menuOpen ? "rotate(-45deg) translate(2px, -2px)" : "none",
                transition: "transform 0.25s ease, width 0.25s ease, background 0.25s ease",
              }} />
            </button>
          </div>

        </div>

        {/* Mobile Menu — Orders, Admin/Login live here too, guest or logged in */}
        <div 
          className="md:hidden"
          style={{
            maxHeight: menuOpen ? "320px" : "0px",
            opacity: menuOpen ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.35s ease, opacity 0.25s ease",
            borderTop: menuOpen ? "1px solid rgba(240,237,230,0.06)" : "1px solid transparent",
          }}
        >
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <Link href="/products" onClick={() => setMenuOpen(false)} style={{ color: "#f0ede6", textDecoration: "none", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Shop</Link>
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
        </div>
      </nav>
    </>
  )
}
