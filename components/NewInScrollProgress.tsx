"use client"

import { useEffect, useRef } from "react"

// بيتابع سكرول الـ New In الأفقي على الموبايل وبيحدث progress bar رفيع تحته
// بشكل حي. مالوش تأثير على الديسكتوب (الـ wrap بيبقى grid عادي هناك أصلاً).
export function NewInScrollProgress() {
  const fillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollEl = document.querySelector<HTMLDivElement>(".newin-grid")
    const fillEl = fillRef.current
    if (!scrollEl || !fillEl) return

    function updateProgress() {
      if (!scrollEl || !fillEl) return
      const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth
      if (maxScroll <= 0) {
        fillEl.style.width = "100%"
        return
      }
      const ratio = scrollEl.scrollLeft / maxScroll
      const visibleRatio = scrollEl.clientWidth / scrollEl.scrollWidth
      const trackWidth = 1 - visibleRatio
      fillEl.style.width = `${visibleRatio * 100}%`
      fillEl.style.transform = `translateX(${(ratio * trackWidth * 100) / visibleRatio}%)`
    }

    updateProgress()
    scrollEl.addEventListener("scroll", updateProgress, { passive: true })
    window.addEventListener("resize", updateProgress)
    return () => {
      scrollEl.removeEventListener("scroll", updateProgress)
      window.removeEventListener("resize", updateProgress)
    }
  }, [])

  return (
    <div className="newin-progress-track" aria-hidden="true">
      <div className="newin-progress-fill" ref={fillRef} />
    </div>
  )
}
