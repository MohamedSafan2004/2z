"use client"

import { useEffect, Suspense, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Script from "next/script"

const PIXEL_ID = "1053292133816022"

// 1. تعريف واجهة (Interface) لبيانات العميل اللي هنبعتها لفيسبوك
export interface AdvancedMatching {
  em?: string; // Email
  ph?: string; // Phone number (يفضل مع كود الدولة)
  fn?: string; // First Name
  ln?: string; // Last Name
}

function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return
    // PageView على كل تنقل بين الصفحات
    window.fbq("track", "PageView")
  }, [pathname, searchParams])

  return null
}

// 2. استقبال بيانات العميل كـ Props
export default function MetaPixel({ userData }: { userData?: AdvancedMatching }) {
  // 3. تحويل البيانات لنص JSON عشان تتركب جوه كود الـ Script (أو كائن فارغ لو مفيش بيانات)
  const advancedMatchingString = userData && Object.keys(userData).length > 0
    ? JSON.stringify(userData)
    : "{}"

  // دليل قاطع من Chrome Performance trace حقيقي (مش تخمين): تحميل fbevents.js
  // وحده بياخد حتى 568ms Long Task على الـ main thread، ومعاه fbq('init')
  // بيجيب ملف تاني اسمه signals/config بياخد لوحده 716ms — وده أضخم Long Task
  // في التريس كله. المشكلة إن ده كان بيحصل تلقائي بعد window.onload (lazyOnload)
  // بغض النظر عن هل المستخدم بيحاول يتفاعل مع الصفحة في نفس اللحظة دي ولا لأ —
  // فلو المستخدم حاول يسكرول في أي وقت بين ثانية 3 و23 من فتح الصفحة، كان في
  // احتمال كبير يصطدم بواحدة من الـ Long Tasks دي ويحس إن الصفحة "مجمدة".
  //
  // الحل: نأجل تحميل الـ Pixel بالكامل لحد أول إشارة تفاعل حقيقية من
  // المستخدم (scroll/touchstart/pointermove/keydown) بدل ما نعتمد على توقيت
  // ثابت زي window.onload. ده معناه الـ Pixel مش بيشتغل خالص لحد ما المستخدم
  // يبدأ فعليًا يتفاعل، فمفيش احتمال تصادم بين تحميله وأول سكرول. الـ retry
  // logic في lib/meta-pixel.ts (fbqTrack) أصلاً مبني يستحمل التأخير ده.
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return

    function loadPixel() {
      if (loadedRef.current) return
      loadedRef.current = true
      cleanup()

      const script = document.createElement("script")
      script.id = "meta-pixel-base"
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');

        fbq('init', '${PIXEL_ID}', ${advancedMatchingString});
        fbq('track', 'PageView');
        window.__fbqReady = true;
      `
      document.body.appendChild(script)
    }

    const events: (keyof WindowEventMap)[] = ["scroll", "touchstart", "pointermove", "keydown", "click"]
    function cleanup() {
      events.forEach((ev) => window.removeEventListener(ev, loadPixel))
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }

    events.forEach((ev) => window.addEventListener(ev, loadPixel, { passive: true, once: true }))
    // fallback: لو المستخدم فعلاً مالوش أي تفاعل (نادر) — حمّل بعد 8 ثواني
    // عشان الـ tracking متتفوتش تمامًا على الزيارات النادرة دي، لكن بعد
    // وقت كافي إن أي Long Task حصلت هنا متتصادمش مع تفاعل مستخدم عادي.
    const fallbackTimer = setTimeout(loadPixel, 8000)

    return cleanup
  }, [advancedMatchingString])

  return (
    <>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  )
}
