"use client"

type PaymentMethod = "cod" | "instapay"

const PAYMENT_ICONS: Record<PaymentMethod, React.ReactNode> = {
  cod: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M2 10h20" />
    </svg>
  ),
  instapay: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  ),
}

interface PaymentOption {
  id: PaymentMethod
  label: string
  sub: string
}

interface PaymentCardProps {
  options: PaymentOption[]
  selected: PaymentMethod
  onSelect: (id: PaymentMethod) => void
}

export default function PaymentCard({ options, selected, onSelect }: PaymentCardProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {options.map((m) => {
        const isSelected = selected === m.id
        return (
          <div
            key={m.id}
            onClick={() => onSelect(m.id)}
            style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "18px 16px", borderRadius: "14px",
              border: isSelected ? "1.5px solid #f0ede6" : "1.5px solid rgba(240,237,230,0.14)",
              background: isSelected ? "rgba(240,237,230,0.06)" : "rgba(255,255,255,0.015)",
              cursor: "pointer", transition: "border-color 0.18s ease, background 0.18s ease",
            }}
          >
            <div style={{ width: "42px", height: "42px", borderRadius: "11px", flexShrink: 0, background: "rgba(240,237,230,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(240,237,230,0.75)" }}>
              <span style={{ width: "20px", height: "20px", display: "block" }}>{PAYMENT_ICONS[m.id]}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14.5px", letterSpacing: "0.01em", marginBottom: "3px" }}>{m.label}</div>
              <div style={{ fontSize: "10.5px", color: "rgba(240,237,230,0.42)" }}>{m.sub}</div>
            </div>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0, border: isSelected ? "1.5px solid #f0ede6" : "1.5px solid rgba(240,237,230,0.3)", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.18s ease" }}>
              <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#f0ede6", opacity: isSelected ? 1 : 0, transform: isSelected ? "scale(1)" : "scale(0.4)", transition: "all 0.18s ease" }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}