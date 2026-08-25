"use client"

import React, { useEffect, useRef } from "react"

// الـ IntersectionObserver نفسه خفيف وبيتعمل فورًا (مفيش داعي نأجله). اللي كان
// بيسبب زحمة على main thread وقت أول تحميل الصفحة هو إن كل نسخ RevealSection
// (10+ في صفحة الهوم) كانوا بيلمسوا الـ DOM style (opacity/transform/transition)
// مع بعض بالظبط في نفس لحظة الـ mount — وده كان بيتزامن مع تحميل الصور التقيلة
// (hero + منتجات)، فكان المستخدم بيحس إن السكرول بيتجمد لأول 2-3 ثواني.
//
// الحل: نأجل بس تطبيق الـ initial hidden style (opacity: 0) لحد ما المتصفح يبقى
// فاضي شوية (requestIdleCallback). لو العنصر أصلاً فوق الشاشة (زي عنوان "New In")
// أول ما نخفيه بعد التأجيل هيبان وميض بسيط، فبنتحقق الأول لو هو أصلاً ظاهر —
// لو ظاهر، مفيش داعي نخفيه أو نعمل reveal animation خالص، بيتسجل ك"ظاهر من الأول".
export function RevealSection({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let idleHandle: number | null = null
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null
    let observer: IntersectionObserver | null = null

    const applyHiddenAndObserve = () => {
      const rect = el.getBoundingClientRect()
      const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0

      if (alreadyVisible) {
        // العنصر ظاهر أصلاً وقت ما وصلنا هنا — نسيبه زي ما هو من غير أي إخفاء
        // أو أنيميشن، عشان مفيش وميض بصري.
        return
      }

      el.style.opacity = "0"
      el.style.transform = "translateY(28px)"
      el.style.transition = `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`

      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.style.opacity = "1"
            el.style.transform = "translateY(0)"
            observer?.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(el)
    }

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(applyHiddenAndObserve, { timeout: 500 })
    } else {
      // Safari (كل نسخه لحد دلوقتي) مفهوش requestIdleCallback — fallback بسيط
      timeoutHandle = setTimeout(applyHiddenAndObserve, 50)
    }

    return () => {
      observer?.disconnect()
      if (idleHandle !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle)
      }
      if (timeoutHandle !== null) clearTimeout(timeoutHandle)
    }
  }, [delay])

  return <div ref={ref} className={className}>{children}</div>
}
