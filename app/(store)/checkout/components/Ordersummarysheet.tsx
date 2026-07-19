"use client"

import { useRef, useState } from "react"

interface OrderSummarySheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function OrderSummarySheet({ open, onClose, children }: OrderSummarySheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [dragY, setDragY] = useState(0)
  const dragStartY = useRef(0)
  const isDragging = useRef(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY
    isDragging.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const delta = e.touches[0].clientY - dragStartY.current
    if (delta > 0) setDragY(delta)
  }

  const handleTouchEnd = () => {
    isDragging.current = false
    if (dragY > 100) {
      onClose()
    }
    setDragY(0)
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.28s ease",
          zIndex: 90,
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: "#0c0c0c",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(240,237,230,0.12)",
          borderBottom: "none",
          transform: open ? `translateY(${dragY}px)` : "translateY(100%)",
          transition: isDragging.current ? "none" : "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
          zIndex: 91,
          maxHeight: "78vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ padding: "12px 0 8px", display: "flex", justifyContent: "center", cursor: "grab", flexShrink: 0 }}
        >
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "rgba(240,237,230,0.25)" }} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 20px 18px",
            flexShrink: 0,
            borderBottom: "1px solid rgba(240,237,230,0.08)",
          }}
        >
          <span style={{ fontSize: "16px", letterSpacing: "0.01em" }}>Order summary</span>
          <button
            onClick={onClose}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "rgba(240,237,230,0.08)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.7)" strokeWidth="2" width="14" height="14">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "20px 20px calc(20px + env(safe-area-inset-bottom))", WebkitOverflowScrolling: "touch" }}>
          {children}
        </div>
      </div>
    </>
  )
}