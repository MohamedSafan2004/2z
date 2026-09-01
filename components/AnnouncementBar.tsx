"use client"

// شريط إعلاني ثابت فوق كل حاجة (فوق الـ Navbar) — زي Zara / H&M / Nike.
// الشريط نفسه (الموضع) ثابت وبيفضل ظاهر في كل صفحات المتجر، لكن النص جواه
// عبارة عن marquee بطيء (بيلف يمين لشمال) عشان العميل ياخد وقته يقرا العرض
// كامل قبل ما يتكرر. السرعة هنا أبطأ بكتير من MarqueeStrip.tsx بتاع الهوم بيدج
// (58s بدل 22s) لأن الرسالة هنا تسويقية لازم تتقرا، مش ديكور خلفي بس.
//
// لتغيير الرسالة: عدّل MESSAGE_PARTS بس. كل جزء عنده bold: true/false للتحكم
// في التركيز البصري (الأجزاء المهمة زي "Buy 2 Get 1 Free" بولد، والباقي عادي).
const MESSAGE_PARTS: { text: string; bold?: boolean }[] = [
  { text: "BUY 2 GET 1 FREE", bold: true },
  { text: "— mix any colors & sizes", bold: false },
]

const REPEAT_COUNT = 6 // عدد تكرارات الرسالة جوه المسار — يغطي عرض الشاشة كامل مهما كانت واسعة

function MarqueeMessage() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
      {MESSAGE_PARTS.map((part, i) => (
        <span key={i} style={{ fontWeight: part.bold ? 700 : 400, opacity: part.bold ? 1 : 0.65 }}>
          {part.text}
        </span>
      ))}
    </span>
  )
}

export default function AnnouncementBar() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        height: "38px",
        background: "#f0ede6",
        color: "#080808",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes announcementScrollX {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .announcement-marquee-track {
          display: flex;
          align-items: center;
          width: max-content;
          animation: announcementScrollX 58s linear infinite;
          will-change: transform;
        }
        .announcement-marquee-item {
          display: inline-flex;
          align-items: center;
          gap: 22px;
          font-family: 'Space Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          white-space: nowrap;
          padding: 0 22px;
        }
        .announcement-marquee-dash {
          opacity: 1;
          font-weight: 700;
          color: #080808;
          font-size: 11px;
        }
      `}</style>
      <div className="announcement-marquee-track">
        {Array.from({ length: REPEAT_COUNT * 2 }).map((_, i) => (
          <span key={i} className="announcement-marquee-item">
            <MarqueeMessage />
            <span className="announcement-marquee-dash">—</span>
          </span>
        ))}
      </div>
    </div>
  )
}
