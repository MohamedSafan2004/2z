"use client"

interface CheckoutCardProps {
  step: number
  done?: boolean
  title: string
  children: React.ReactNode
}

export default function CheckoutCard({ step, done, title, children }: CheckoutCardProps) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(240,237,230,0.1)", borderRadius: "18px", padding: "24px 20px", marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div
          style={{
            width: "24px", height: "24px", borderRadius: "50%",
            background: done ? "rgba(240,237,230,0.9)" : "rgba(240,237,230,0.08)",
            color: done ? "#050505" : "rgba(240,237,230,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "10px", flexShrink: 0,
          }}
        >
          {done ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
              <path d="M5 13l4 4L19 7" />
            </svg>
          ) : step}
        </div>
        <span style={{ fontSize: "15px", letterSpacing: "0.01em", fontWeight: 400 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}