import { RevealSection } from "@/components/RevealSection"

export function HomeFooterStrip() {
  return (
    <RevealSection>
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(200,240,79,0.35), transparent)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.5)" }}>2Z — Egypt</span>
        <span style={{ fontFamily: "Space Mono, monospace", fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,237,230,0.5)" }}>Oversized T-Shirts</span>
      </div>
    </RevealSection>
  )
}
