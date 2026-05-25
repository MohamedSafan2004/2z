export function SkeletonCard() {
  return (
    <div style={{
      background: "linear-gradient(90deg, #141414 25%, #1c1c1c 50%, #141414 75%)",
      backgroundSize: "800px 100%",
      animation: "shimmer 1.5s infinite",
      aspectRatio: "3/4",
      width: "100%",
    }} />
  )
}

export function SkeletonLine({ width = "100%", height = "14px" }: { width?: string; height?: string }) {
  return (
    <div style={{
      background: "linear-gradient(90deg, #141414 25%, #1c1c1c 50%, #141414 75%)",
      backgroundSize: "800px 100%",
      animation: "shimmer 1.5s infinite",
      width, height, marginBottom: "8px",
    }} />
  )
}

export function SkeletonBlock({ height = "200px" }: { height?: string }) {
  return (
    <div style={{
      background: "linear-gradient(90deg, #141414 25%, #1c1c1c 50%, #141414 75%)",
      backgroundSize: "800px 100%",
      animation: "shimmer 1.5s infinite",
      width: "100%", height,
    }} />
  )
}