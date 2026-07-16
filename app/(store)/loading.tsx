// app/(store)/loading.tsx
import { SkeletonBlock, SkeletonLine } from "@/components/Skeleton"

export default function HomeLoading() {
  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <style>{`
        @media (min-width: 640px) { .newin-grid-loading { grid-template-columns: repeat(4, 1fr) !important; } }
      `}</style>

      {/* Hero placeholder */}
      <div style={{ position: "relative", width: "100%", height: "88vh", minHeight: "560px", background: "#0d0d0d" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "24px", paddingBottom: "56px" }}>
          <div style={{ marginBottom: "36px" }}>
            <SkeletonLine width="280px" height="60px" />
          </div>
          <SkeletonLine width="200px" height="40px" />
        </div>
      </div>

      {/* New In grid placeholder */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 20px" }}>
        <div style={{ marginBottom: "28px" }}>
          <SkeletonLine width="100px" height="14px" />
        </div>
        <div
          className="newin-grid-loading"
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2px" }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ aspectRatio: "3/4", width: "100%" }}>
              <SkeletonBlock height="100%" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}