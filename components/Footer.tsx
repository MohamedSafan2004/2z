import Link from "next/link"
import React from "react"

const linkStyle: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(240,237,230,0.6)",
  textDecoration: "none",
  display: "block",
  transition: "color 0.2s",
}

const socialStyle: React.CSSProperties = {
  width: "38px",
  height: "38px",
  border: "1px solid rgba(240,237,230,0.12)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(240,237,230,0.5)",
  textDecoration: "none",
  transition: "border-color 0.2s, color 0.2s",
  flexShrink: 0,
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: "9px",
  letterSpacing: "0.25em",
  textTransform: "uppercase",
  color: "rgba(240,237,230,0.25)",
  marginBottom: "20px",
  marginTop: 0,
}

export default function Footer() {
  return (
    <footer style={{
      background: "#080808",
      borderTop: "1px solid rgba(240,237,230,0.06)",
      fontFamily: "'Space Mono', monospace",
    }}>
      <style>{`
        .footer-link:hover { color: #f0ede6 !important; }
        .footer-social:hover { border-color: rgba(240,237,230,0.35) !important; color: #f0ede6 !important; }
        @media (min-width: 768px) {
          .footer-top { grid-template-columns: 1fr 1fr !important; }
          .footer-brand { text-align: left !important; }
          .footer-socials { justify-content: flex-start !important; }
        }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "56px 24px 32px" }}>

        {/* Top */}
        <div
          className="footer-top"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "48px",
            marginBottom: "48px",
          }}
        >
          {/* Brand */}
          <div className="footer-brand" style={{ textAlign: "center" }}>
            <img
              src="/logo.jpeg"
              alt="2Z"
              style={{
                height: "36px",
                width: "36px",
                objectFit: "cover",
                borderRadius: "50%",
                marginBottom: "16px",
                mixBlendMode: "screen",
              }}
            />
            <p style={{
              fontSize: "10px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(240,237,230,0.4)",
              lineHeight: 2,
              margin: "0 0 20px",
            }}>
              Oversized T-shirts<br />6th of October, Egypt
            </p>
            <div
              className="footer-socials"
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              <a
                href="https://www.instagram.com/2z_offical?igsh=MWh3dWZiYWN1ZzdrZA%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="footer-social"
                style={socialStyle}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@2z_offical?_r=1&_t=ZS-96kSCZpQdl3"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="footer-social"
                style={socialStyle}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Nav Links */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            <div>
              <p style={sectionLabelStyle}>Shop</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <Link href="/products" className="footer-link" style={linkStyle}>All</Link>
                <Link href="/products?category=t-shirts" className="footer-link" style={linkStyle}>T-Shirts</Link>
                <Link href="/products?category=sweatpants" className="footer-link" style={linkStyle}>Sweatpants</Link>
              </div>
            </div>
            <div>
              <p style={sectionLabelStyle}>Info</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <Link href="/contact" className="footer-link" style={linkStyle}>Contact</Link>
                <Link href="/privacy" className="footer-link" style={linkStyle}>Privacy</Link>
                <Link href="/terms" className="footer-link" style={linkStyle}>Terms</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: "1px solid rgba(240,237,230,0.06)",
          paddingTop: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}>
          <p style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,237,230,0.25)", margin: 0 }}>
            © 2026 2Z
          </p>
          <p style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,237,230,0.25)", margin: 0 }}>
            6th of October, Egypt
          </p>
        </div>

      </div>
    </footer>
  )
}