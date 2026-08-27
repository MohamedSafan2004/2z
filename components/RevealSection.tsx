"use client"

import React, { useEffect, useRef } from "react"

// الـ IntersectionObserver نفسه خفيف وبيتعمل فورًا (مفيش داعي نأجله). اللي كان
// بيسبب زحمة على main thread وقت أول تحميل الصفحة هو إن كل نسخ RevealSection
// (10+ في صفحة الهوم) كانوا بيلمسوا الـ DOM style (opacity/transform/transition)
// مع بعض بالظبط في نفس لحظة الـ mount — وده كان بيتزامن مع تحميل الصور التقيلة
// (hero + منتجات)، فكان المستخدم بيحس إن السكرول بيتجمد لأول 2-3 ثواني.
//
// تاني: حتى بعد requestIdleCallback، لقينا مشكلة تانية أثناء السكرول نفسه:
// Safari (كل نسخه لحد دلوقتي) مفهوش requestIdleCallback، فكل الـ RevealSection على
// آيفون كانوا بيرجعوا لـ setTimeout(fn, 50) — يعني كل الـ 6-7 sections في الصفحة
// كانوا بينفذوا getBoundingClientRect() (read) وبعدها style.opacity/transform
// (write) في نفس الـ ~50ms تقريبًا لبعض — لو عنصر A بيقرا rect بعد ما عنصر B غيّر
// الـ style بتاعه، المتصفح مضطر يعمل forced synchronous layout. وده بيتكرر تاني
// أثناء السكرول لما كل الـ IntersectionObserver callbacks بتاعت الـ sections
// بتتفعل تقريبًا في نفس اللحظة وكل واحدة بتكتب على الـ DOM لوحدها.
//
// الحل: rAF module-level queue — أي scheduled work (initial hide أو reveal
// عند الـ intersection) بيتجمع في قايمة واحدة مشتركة بين كل نسخ RevealSection،
// وبتتطبق كلها مرة واحدة في نفس الـ requestAnimationFrame بدل ما كل واحدة تكتب
// لوحدها في لحظتها. القراءة (getBoundingClientRect) لسه بتحصل مرة واحدة لكل
// عنصر عند الـ mount بس، بس مش متداخلة مع كتابة عنصر تاني.

type PendingWrite = () => void
let pendingWrites: PendingWrite[] = []
let flushScheduled = false

function scheduleWrite(write: PendingWrite) {
  pendingWrites.push(write)
  if (flushScheduled) return
  flushScheduled = true
  requestAnimationFrame(() => {
    const writes = pendingWrites
    pendingWrites = []
    flushScheduled = false
    for (const w of writes) w()
  })
}

export function RevealSection({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let timeoutHandle: ReturnType<typeof setTimeout> | null = null
    let observer: IntersectionObserver | null = null

    const applyHiddenAndObserve = () => {
      // القراءة بتحصل فورًا برة الـ rAF queue — مش مشكلة طالما مجمعتش مع
      // write تاني في نفس الـ tick (الـ writes هي اللي بتتجمع وتتأجل).
      const rect = el.getBoundingClientRect()
      const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0

      if (alreadyVisible) {
        // العنصر ظاهر أصلاً وقت ما وصلنا هنا — نسيبه زي ما هو من غير أي إخفاء
        // أو reveal animation، عشان مفيش وميض بصري.
        return
      }

      scheduleWrite(() => {
        el.style.opacity = "0"
        el.style.transform = "translateY(28px)"
        el.style.transition = `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`
      })

      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            scheduleWrite(() => {
              el.style.opacity = "1"
              el.style.transform = "translateY(0)"
            })
            observer?.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(el)
    }

    // موحد لكل المتصفحات (بدل requestIdleCallback اللي Safari مفهوش)، setTimeout
    // قصير بس كفاية عشان منتعملش قبل أول paint مباشرة بعد الـ mount — والـ
    // scheduleWrite فوق هي اللي بتمنع التزاحم مع الـ setTimeout نفسه.
    timeoutHandle = setTimeout(applyHiddenAndObserve, 50)

    return () => {
      observer?.disconnect()
      if (timeoutHandle !== null) clearTimeout(timeoutHandle)
    }
  }, [delay])

  return <div ref={ref} className={className}>{children}</div>
}
