"use client"

// شريط إعلاني ثابت فوق كل حاجة (فوق الـ Navbar) — زي Zara / H&M / Nike.
// مبيتحركش أبدًا حتى وانت بتسكرول. ظاهر في كل صفحات المتجر.
export default function AnnouncementBar() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        height: "32px",
        background: "#f0ede6",
        color: "#080808",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "0 16px",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/>
      </svg>
      <span
        style={{
          fontFamily: "Space Mono, monospace",
          fontSize: "10px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Free shipping on orders over <strong>1000 EGP</strong>
      </span>
    </div>
  )
}
