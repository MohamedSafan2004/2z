"use client"

interface PromoCardProps {
  promoInput: string
  onPromoInputChange: (v: string) => void
  promoApplied: string
  promoDiscount: number
  promoLoading: boolean
  promoError: string
  promoSuccess: string
  onApply: () => void
  onRemove: () => void
}

export default function PromoCard({
  promoInput, onPromoInputChange, promoApplied, promoDiscount,
  promoLoading, promoError, promoSuccess, onApply, onRemove,
}: PromoCardProps) {
  if (!promoApplied) {
    return (
      <div>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={promoInput}
            onChange={(e) => onPromoInputChange(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && onApply()}
            placeholder="Enter code"
            style={{
              flex: 1, height: "54px", padding: "0 16px",
              background: "rgba(255,255,255,0.02)", border: "1.5px solid rgba(240,237,230,0.14)",
              borderRadius: "14px", color: "#f0ede6", fontFamily: "Space Mono, monospace",
              fontSize: "14.5px", outline: "none", letterSpacing: "0.05em",
            }}
          />
          <button
            onClick={onApply}
            disabled={promoLoading}
            style={{
              height: "54px", padding: "0 20px", borderRadius: "14px",
              background: "rgba(240,237,230,0.08)", border: "1.5px solid rgba(240,237,230,0.14)",
              color: promoLoading ? "rgba(240,237,230,0.3)" : "#f0ede6",
              fontFamily: "Space Mono, monospace", fontSize: "12px", letterSpacing: "0.05em",
              cursor: promoLoading ? "not-allowed" : "pointer", whiteSpace: "nowrap",
            }}
          >
            {promoLoading ? "..." : "Apply"}
          </button>
        </div>
        {promoError && <p style={{ fontSize: "10.5px", color: "#ff6b6b", marginTop: "10px", letterSpacing: "0.05em" }}>{promoError}</p>}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: "14px", background: "rgba(240,237,230,0.06)", border: "1.5px solid rgba(240,237,230,0.3)" }}>
        <div>
          <p style={{ fontSize: "13px", color: "rgba(240,237,230,0.9)", letterSpacing: "0.05em" }}>{promoApplied}</p>
          <p style={{ fontSize: "10.5px", color: "rgba(180,255,180,0.6)", marginTop: "2px" }}>{promoDiscount}% off</p>
        </div>
        <button onClick={onRemove} style={{ fontSize: "10px", color: "rgba(240,237,230,0.4)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "Space Mono, monospace", letterSpacing: "0.05em" }}>
          Remove
        </button>
      </div>
      {promoSuccess && !promoError && <p style={{ fontSize: "10.5px", color: "rgba(240,237,230,0.7)", marginTop: "10px", letterSpacing: "0.05em" }}>{promoSuccess}</p>}
    </div>
  )
}