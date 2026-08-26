"use client"

import { useEffect, useRef, useState } from "react"
import styles from "../../app/(store)/home.module.css"

const MARQUEE_ITEMS = [
  "2Z Store",
  "Egypt SS26",
  "Minimal Streetwear",
  "Oversized Fit",
  "Made For Egypt",
  "Black · White · Grey · Beige",
]

// عدد النسخ لازم يكون زوجي دايمًا — الأنيميشن (marqueeScroll) بتتحرك -50% من عرض
// الـ track الكامل، يعني بتفترض إن أول نص العناصر = تاني نصها بالظبط. لو الشاشة
// أعرض من نسخة واحدة من العناصر، بيحصل فراغ محسوس ("قفزة") عند نقطة الرجوع لبداية
// الحلقة. الحل: نحسب ديناميكيًا كام نسخة محتاجين عشان مجموع عرضهم يغطي على الأقل
// ضعف عرض الشاشة — كده مضمون مفيش فراغ مهما كان عرض الشاشة أو طول النصوص.
function useMarqueeRepeatCount() {
  const [repeatCount, setRepeatCount] = useState(2)
  const measureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const measureEl = measureRef.current
    if (!measureEl) return

    const calculate = () => {
      const oneSetWidth = measureEl.scrollWidth
      const viewportWidth = window.innerWidth
      if (oneSetWidth === 0) return

      // محتاجين ضعف عرض الشاشة على الأقل عشان نص النسخ (اللي بيتحرك -50%)
      // يفضل أعرض من الشاشة نفسها في أي وقت.
      const minTotalWidth = viewportWidth * 2
      const setsNeeded = Math.ceil(minTotalWidth / oneSetWidth)
      // زوجي دايمًا عشان الـ -50% يقسم الحلقة نصين متطابقين بالظبط
      const evenSets = setsNeeded % 2 === 0 ? setsNeeded : setsNeeded + 1
      setRepeatCount(Math.max(2, evenSets))
    }

    calculate()

    const observer = new ResizeObserver(calculate)
    observer.observe(measureEl)
    window.addEventListener("resize", calculate)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", calculate)
    }
  }, [])

  return { repeatCount, measureRef }
}

export function MarqueeStrip() {
  const { repeatCount, measureRef } = useMarqueeRepeatCount()

  return (
    <div className={styles["marquee-wrap"]}>
      {/* نسخة قياس مخفية — بتحسب عرض نص واحد من العناصر من غير ما تتحرك أو تتشاف،
          عشان نعرف نحتاج كام نسخة نملأ بيها أي عرض شاشة */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{ position: "absolute", visibility: "hidden", pointerEvents: "none", display: "flex", gap: "48px", whiteSpace: "nowrap" }}
      >
        {MARQUEE_ITEMS.map((text) => (
          <span key={text} className={styles["marquee-item"]}>{text}</span>
        ))}
      </div>

      <div className={styles["marquee-track"]}>
        {[...Array(repeatCount)].map((_, repeatIdx) => (
          <span key={repeatIdx} style={{ display: "contents" }}>
            {MARQUEE_ITEMS.map((text) => (
              <span key={text} className={styles["marquee-item"]}>{text}</span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
