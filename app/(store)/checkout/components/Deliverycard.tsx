"use client"

import { SHIPPING_RATES, SHIPPING_LABELS, type ShippingZone } from "@/lib/shipping"

const ZONE_DESCRIPTIONS: Record<ShippingZone, string> = {
  egypt: "2–3 business days"
}

interface DeliveryCardProps {
  zones: ShippingZone[]
  selected: ShippingZone | ""
  onSelect: (zone: ShippingZone) => void
}

export default function DeliveryCard({ zones, selected, onSelect }: DeliveryCardProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {zones.map((z) => {
        const isSelected = selected === z
        return (
          <div
            key={z}
            onClick={() => onSelect(z)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
              padding: "16px", borderRadius: "14px",
              border: isSelected ? "1.5px solid #f0ede6" : "1.5px solid rgba(240,237,230,0.14)",
              background: isSelected ? "rgba(240,237,230,0.06)" : "rgba(255,255,255,0.015)",
              cursor: "pointer", transition: "border-color 0.18s ease, background 0.18s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
              <div
                style={{
                  width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0,
                  border: isSelected ? "1.5px solid #f0ede6" : "1.5px solid rgba(240,237,230,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "border-color 0.18s ease",
                }}
              >
                <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#f0ede6", opacity: isSelected ? 1 : 0, transform: isSelected ? "scale(1)" : "scale(0.4)", transition: "all 0.18s ease" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "14.5px", letterSpacing: "0.01em" }}>{SHIPPING_LABELS[z]}</span>
                <span style={{ fontSize: "10.5px", color: "rgba(240,237,230,0.4)" }}>{ZONE_DESCRIPTIONS[z]}</span>
              </div>
            </div>
            <span style={{ fontSize: "14px", color: isSelected ? "rgba(240,237,230,0.9)" : "rgba(240,237,230,0.55)", flexShrink: 0 }}>
              {SHIPPING_RATES[z]} EGP
            </span>
          </div>
        )
      })}
    </div>
  )
}