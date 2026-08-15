"use client"

import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping"

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
        height: "38px",
        background: "#f0ede6",
        color: "#080808",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
      }}
    >
      <span
        style={{
          fontFamily: "Space Mono, monospace",
          fontSize: "10.5px",
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Free Shipping <span style={{ fontWeight: 400, letterSpacing: "0.08em", opacity: 0.65 }}>on orders over</span> {FREE_SHIPPING_THRESHOLD} EGP
      </span>
    </div>
  )
}
