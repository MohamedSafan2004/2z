import Link from "next/link"

export default function Footer() {
  return (
    <footer style={{ background: "#080808", borderTop: "1px solid rgba(240,237,230,0.06)", padding: "48px 24px 32px", fontFamily: "Space Mono, monospace" }}>
      <style>{`@media (min-width: 768px) { .footer-grid { grid-template-columns: 1fr 1fr 1fr !important; } }`}</style>
      <div style={{ maxWidth: "1450px", margin: "0 auto" }}>

        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", marginBottom: "40px" }}>

          {/* Brand */}
          <div>
            <img src="/logo.jpeg" alt="2Z" style={{ height: "48px", width: "48px", objectFit: "cover", borderRadius: "50%", marginBottom: "10px", mixBlendMode: "screen" }}/>
            <p style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#b0aea8", lineHeight: 2 }}>
              Oversized T-shirts<br />6th of October, Egypt
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              
               <a href="https://www.instagram.com/2z_offical?igsh=MWh3dWZiYWN1ZzdrZA%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow 2Z on Instagram"
                style={{ width: "44px", height: "44px", border: "1px solid rgba(240,237,230,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#b0aea8", textDecoration: "none" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                </svg>
              </a>
              
               <a href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow 2Z on TikTok"
                style={{ width: "44px", height: "44px", border: "1px solid rgba(240,237,230,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#b0aea8", textDecoration: "none" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <p style={{ fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#b0aea8", marginBottom: "16px" }}>Shop</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {[
                { label: "All Products", href: "/products" },
                { label: "T-Shirts", href: "/products?category=t-shirts" },
                { label: "Sweatpants", href: "/products?category=sweatpants" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#d0cec8", textDecoration: "none", padding: "8px 0", display: "block", minHeight: "44px", lineHeight: "44px" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <p style={{ fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#b0aea8", marginBottom: "16px" }}>Info</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {[
                { label: "Contact Us", href: "/contact" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms & Conditions", href: "/terms" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#d0cec8", textDecoration: "none", padding: "8px 0", display: "block", minHeight: "44px", lineHeight: "44px" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid rgba(240,237,230,0.08)", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#b0aea8" }}>© 2026 2Z. All rights reserved.</p>
          <p style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#b0aea8" }}>6th of October, Egypt</p>
        </div>

      </div>
    </footer>
  )
}