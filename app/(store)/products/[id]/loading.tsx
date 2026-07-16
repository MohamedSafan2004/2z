// app/(store)/products/[id]/loading.tsx
import { SkeletonLine, SkeletonBlock } from "@/components/Skeleton"

export default function ProductDetailLoading() {
  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "Space Mono, monospace" }}>
      <style>{`
        @media (min-width: 768px) { .product-grid-loading { grid-template-columns: 1fr 1fr !important; gap: 64px !important; } }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "70px 20px 80px" }}>

        <div style={{ width: "140px", marginBottom: "32px" }}>
          <SkeletonLine width="100%" height="10px" />
        </div>

        <div
          className="product-grid-loading"
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px", marginTop: "24px" }}
        >
          {/* الصورة */}
          <SkeletonBlock height="500px" />

          {/* التفاصيل */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ marginBottom: "32px" }}>
              <div style={{ marginBottom: "16px" }}>
                <SkeletonLine width="70%" height="40px" />
              </div>
              <SkeletonLine width="120px" height="24px" />
            </div>

            <div style={{ height: "1px", background: "rgba(240,237,230,0.06)", marginBottom: "28px" }} />

            <div style={{ marginBottom: "28px" }}>
              <SkeletonLine width="100%" height="12px" />
              <SkeletonLine width="90%" height="12px" />
              <SkeletonLine width="60%" height="12px" />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ marginBottom: "12px" }}>
                <SkeletonLine width="60px" height="9px" />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <SkeletonBlock height="46px" />
                <SkeletonBlock height="46px" />
                <SkeletonBlock height="46px" />
              </div>
            </div>

            <div style={{ marginBottom: "28px" }}>
              <div style={{ marginBottom: "12px" }}>
                <SkeletonLine width="80px" height="9px" />
              </div>
              <SkeletonLine width="140px" height="36px" />
            </div>

            <div style={{ marginBottom: "10px" }}>
              <SkeletonBlock height="52px" />
            </div>
            <SkeletonBlock height="52px" />
          </div>
        </div>
      </div>
    </div>
  )
}