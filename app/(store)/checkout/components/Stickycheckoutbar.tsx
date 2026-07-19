"use client"

interface StickyCheckoutBarProps {
  total: number
  loading: boolean
  ctaLabel: string
  onSubmit: () => void
  error?: string
}

export default function StickyCheckoutBar({ total, loading, ctaLabel, onSubmit, error }: StickyCheckoutBarProps) {
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(5,5,5,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(240,237,230,0.12)",
        padding: "16px 20px calc(16px + env(safe-area-inset-bottom))",
        zIndex: 30,
      }}
    >
      {error && (
        <p style={{ fontSize: "11px", color: "#ff6b6b", marginBottom: "12px", letterSpacing: "0.03em" }}>{error}</p>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "11px", letterSpacing: "0.04em", color: "rgba(240,237,230,0.5)", marginBottom: "4px" }}>Total</div>
          <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", lineHeight: 1, color: "#f0ede6" }}>
            {total} <span style={{ fontSize: "12px", color: "rgba(240,237,230,0.4)", fontFamily: "Space Mono, monospace" }}>EGP</span>
          </div>
        </div>
      </div>
      <button
        onClick={onSubmit}
        disabled={loading}
        style={{
          width: "100%",
          height: "56px",
          borderRadius: "16px",
          background: "#f0ede6",
          color: "#050505",
          border: "none",
          fontFamily: "Space Mono, monospace",
          fontSize: "13px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {ctaLabel}
      </button>
    </div>
  )
}