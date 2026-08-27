"use client"

import { useEffect, useRef, useState } from "react"
import styles from "../../app/(store)/home.module.css"

const BASE_ITEMS = ["2Z Store", "Egypt SS26", "Minimal Streetwear", "Oversized Fit"]

// بيحسب أقل عدد تكرارات يغطي ضعف عرض الـ viewport (عشان أنيميشن الـ -50%
// يفضل continuous من غير قفزة). دايمًا even number.
export function MarqueeStrip() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [repeats, setRepeats] = useState(4)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const measure = () => {
      const singleSetWidth = BASE_ITEMS.join("").length * 9 // تقريب عريض كفاية
      const viewportWidth = el.clientWidth
      const needed = Math.ceil((viewportWidth * 2) / Math.max(singleSetWidth, 1))
      const rounded = Math.max(4, needed % 2 === 0 ? needed : needed + 1)
      setRepeats(rounded)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const items = Array.from({ length: repeats }, () => BASE_ITEMS).flat()

  return (
    <div className={styles["marquee-wrap"]} ref={wrapRef}>
      <div className={styles["marquee-track"]}>
        {items.map((item, i) => (
          <span key={i} className={styles["marquee-item"]}>{item}</span>
        ))}
      </div>
    </div>
  )
}
