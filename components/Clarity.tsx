"use client"

import Script from "next/script"

const CLARITY_PROJECT_ID = "xv5l7tqp7n"

// lazyOnload بدل afterInteractive: Clarity script مش محتاج يتحمل قبل ما
// المستخدم يقدر يتفاعل مع الصفحة أصلاً (session recording مش حاجة تبدأ
// من أول milisecond). afterInteractive كان بيحمل السكريبت ده في نفس
// الـ window اللي React بيعمل hydrate فيه، يعني بيتزامن بالظبط مع أول
// لحظة المستخدم بيحاول يتفاعل (زي السكرول). lazyOnload بيأجل التحميل
// لحد ما المتصفح يبقى فاضي تمامًا (بعد window.onload)، فميبقاش منافس
// على الـ main thread وقت اللود وأول محاولة سكرول من المستخدم.
export default function Clarity() {
  return (
    <Script
      id="ms-clarity"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
        `,
      }}
    />
  )
}
