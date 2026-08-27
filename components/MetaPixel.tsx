"use client"

import { useEffect, Suspense } from "react"
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

  return (
    <>
      {/* lazyOnload بدل afterInteractive: retry logic جوه fbqTrack() (lib/meta-pixel.ts)
          أصلاً مبني يستحمل تأخير في تحميل الـ pixel (بيحاول 20 مرة كل 100ms
          لو __fbqReady لسه false)، فتأجيل التحميل هنا آمن. الأداء أهم من فرق
          بسيط في توقيت PageView — lazyOnload بيأجل السكريبت لحد بعد
          window.onload، فمش بيزاحم أول محاولة تفاعل/سكرول من المستخدم
          على الـ main thread. */}
      <Script
        id="meta-pixel-base"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            
            // 4. التعديل هنا: تمرير البيانات كمعامل ثالث لحل مشكلة التحذير
            fbq('init', '${PIXEL_ID}', ${advancedMatchingString});
            fbq('track', 'PageView');
            // علامة جاهزية منفصلة عن fbq نفسها — lib/meta-pixel.ts بيتأكد منها
            // قبل ما يبعت أي event تاني عشان ميتبعتش قبل ما fbq('init') يخلص يستقر
            window.__fbqReady = true;
          `,
        }}
      />
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