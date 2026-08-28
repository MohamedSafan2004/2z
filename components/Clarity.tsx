"use client"

import { useEffect, useRef } from "react"

const CLARITY_PROJECT_ID = "xv5l7tqp7n"

// نفس منطق MetaPixel.tsx بالظبط، ولنفس السبب المؤكد من تريس حقيقي: حتى مع
// lazyOnload (بعد window.onload)، clarity.js لسه بيظهر في التريس بينفذ
// Long Task قصيرة (~98ms) بالظبط في النافذة الزمنية اللي المستخدم بيحاول
// يسكرول فيها لأول مرة. مفرداً مش هي المشكلة الكبرى (فيسبوك أكبر بكتير)،
// لكن كل ملي ثانية إضافية على الـ main thread وقت أول تفاعل بتزيد فرصة
// التصادم مع لمسة المستخدم. الحل: تأجيل لحد أول تفاعل حقيقي بدل توقيت ثابت.
export default function Clarity() {
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return

    function loadClarity() {
      if (loadedRef.current) return
      loadedRef.current = true
      cleanup()
      ;(function (c: any, l: Document, a: string, r: string, i: string) {
        c[a] =
          c[a] ||
          function () {
            ;(c[a].q = c[a].q || []).push(arguments)
          }
        const t = l.createElement(r) as HTMLScriptElement
        t.async = true
        t.src = "https://www.clarity.ms/tag/" + i
        const y = l.getElementsByTagName(r)[0]
        y.parentNode?.insertBefore(t, y)
      })(window, document, "clarity", "script", CLARITY_PROJECT_ID)
    }

    const events: (keyof WindowEventMap)[] = ["scroll", "touchstart", "pointermove", "keydown", "click"]
    function cleanup() {
      events.forEach((ev) => window.removeEventListener(ev, loadClarity))
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }

    events.forEach((ev) => window.addEventListener(ev, loadClarity, { passive: true, once: true }))
    const fallbackTimer = setTimeout(loadClarity, 8000)

    return cleanup
  }, [])

  return null
}
