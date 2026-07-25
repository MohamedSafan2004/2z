import Link from "next/link"
import Image from "next/image"
import React from "react"

export default function Footer() {
  return (
    <footer style={{
      background: "#080808",
      borderTop: "1px solid rgba(240,237,230,0.06)",
      fontFamily: "Space Mono, monospace",
    }}>
      <style>{`
        .f-link:hover { color: #f0ede6 !important; }
        .f-social:hover { border-color: rgba(240,237,230,0.4) !important; color: #f0ede6 !important; }
        .f-top {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 40px;
          margin-bottom: 48px;
        }
        .f-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .f-socials {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
        .f-nav {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        .f-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .f-top {
            flex-direction: row;
            align-items: flex-start;
            justify-content: space-between;
            text-align: left;
          }
          .f-brand { align-items: flex-start; }
          .f-socials { justify-content: flex-start; }
          .f-col { align-items: flex-start; }
        }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "56px 24px 32px" }}>
        <div className="f-top">

          {/* Brand */}
          <div className="f-brand">
            <Image src="/logo.jpeg" alt="2Z" width={36} height={36} style={{ objectFit: "cover", borderRadius: "50%", mixBlendMode: "screen" }} />
            <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.3)", lineHeight: 2, margin: 0 }}>
              Minimal Streetwear<br />6th of October, Egypt
            </p>
            <div className="f-socials">
              <a href="https://www.instagram.com/2z.official/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="f-social"
                style={{ width: "38px", height: "38px", border: "1px solid rgba(240,237,230,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,237,230,0.4)", transition: "border-color 0.2s, color 0.2s" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="https://www.tiktok.com/@2z_offical?_r=1&_t=ZS-96kSCZpQdl3" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="f-social"
                style={{ width: "38px", height: "38px", border: "1px solid rgba(240,237,230,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,237,230,0.4)", transition: "border-color 0.2s, color 0.2s" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Nav */}
          <div className="f-nav">
            <div className="f-col">
              <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.2)", margin: 0 }}>Shop</p>
              <Link href="/products" className="f-link" style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)", textDecoration: "none", transition: "color 0.2s" }}>All</Link>
              <Link href="/products?category=t-shirts" className="f-link" style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)", textDecoration: "none", transition: "color 0.2s" }}>T-Shirts</Link>
              <Link href="/products?category=sweatpants" className="f-link" style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)", textDecoration: "none", transition: "color 0.2s" }}>Sweatpants</Link>
            </div>
            <div className="f-col">
              <p style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,237,230,0.2)", margin: 0 }}>Info</p>
              <Link href="/contact" className="f-link" style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)", textDecoration: "none", transition: "color 0.2s" }}>Contact</Link>
              <Link href="/privacy" className="f-link" style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)", textDecoration: "none", transition: "color 0.2s" }}>Privacy & Policy</Link>
              <Link href="/terms" className="f-link" style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,237,230,0.55)", textDecoration: "none", transition: "color 0.2s" }}>Terms</Link>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid rgba(240,237,230,0.06)", paddingTop: "24px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,237,230,0.2)", margin: 0 }}>© 2026 2Z</p>
          <p style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,237,230,0.2)", margin: 0 }}>6th of October, Egypt</p>
        </div>

      </div>
    </footer>
  )
}