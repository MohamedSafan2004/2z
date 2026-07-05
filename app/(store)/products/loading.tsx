import { SkeletonCard } from "@/components/Skeleton"

export default function ProductsLoading() {
  return (
    <div style={{ background: "#080808", color: "#f0ede6", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <style>{`
        @media (min-width: 640px)  { .p-grid-loading { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (min-width: 1024px) { .p-grid-loading { grid-template-columns: repeat(4, 1fr) !important; } }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 20px 80px" }}>

        <div style={{ marginBottom: "56px", borderBottom: "1px solid rgba(240,237,230,0.06)", paddingBottom: "40px" }}>
          <p style={{
            fontSize: "9px", letterSpacing: "0.35em", textTransform: "uppercase",
            color: "rgba(240,237,230,0.3)", marginBottom: "14px",
          }}>
            Collection — SS 26
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
            <h1 style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "clamp(36px, 6vw, 64px)",
              fontWeight: 300, lineHeight: 1,
              color: "#f0ede6", margin: 0,
            }}>
              Essential<br />
              <em style={{ color: "rgba(240,237,230,0.35)", fontStyle: "italic" }}>Tees</em>
            </h1>
            <p style={{
              fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase",
              color: "rgba(240,237,230,0.3)", lineHeight: 2, margin: 0,
            }}>
              Black · White · Grey · Beige<br />
              550 EGP
            </p>
          </div>
        </div>

        <div
          className="p-grid-loading"
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2px" }}
        >
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

      </div>
    </div>
  )
}