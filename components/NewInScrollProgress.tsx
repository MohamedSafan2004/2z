"use client"

import { useEffect, useRef } from "react"

// بيتابع سكرول الـ New In الأفقي على الموبايل وبيحدث progress bar رفيع تحته
// بشكل حي. مالوش تأثير على الديسكتوب (الـ wrap بيبقى grid عادي هناك أصلاً).
export function NewInScrollProgress({
  trackClassName = "newin-progress-track",
  fillClassName = "newin-progress-fill",
}: {
  trackClassName?: string
  fillClassName?: string
} = {}) {
  const fillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollEl = document.querySelector<HTMLDivElement>("[data-newin-grid]")
    const fillEl = fillRef.current
    if (!scrollEl || !fillEl) return

    // rAF throttle: الـ scroll event بيتطلق أكتر من مرة في نفس الـ frame
    // أثناء اللمس على iOS. من غير throttle، كل event كان بيعمل read (scrollWidth/
    // clientWidth/scrollLeft) وwrite (style.width/transform) على الـ DOM في
    // نفس الـ synchronous call، وده بيسبب layout thrashing لو حصل كذا مرة في
    // نفس الـ frame. rAF بيضمن إن القراءة والكتابة تحصل مرة واحدة بس لكل frame.
    let ticking = false

    function updateProgress() {
      ticking = false
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

    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(updateProgress)
    }

    updateProgress()
    scrollEl.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      scrollEl.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return (
    <div className={trackClassName} aria-hidden="true">
      <div className={fillClassName} ref={fillRef} />
    </div>
  )
}
