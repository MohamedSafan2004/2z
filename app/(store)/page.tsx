// app/(store)/page.tsx
import { ReviewsGallery } from "@/components/ReviewsGallery"
import { HeroSection } from "@/components/home/HeroSection"
import { MarqueeStrip } from "@/components/home/MarqueeStrip"
import { BestSellersSection } from "@/components/home/BestSellersSection"
import { NewInSection } from "@/components/home/NewInSection"
import { ReviewsCta } from "@/components/home/ReviewsCta"
import { StatementSection } from "@/components/home/StatementSection"
import { ComingSoonTeaser } from "@/components/home/ComingSoonTeaser"
import { CategoriesSection } from "@/components/home/CategoriesSection"
import { HomeFooterStrip } from "@/components/home/HomeFooterStrip"
import styles from "./home.module.css"

// بيتخزن لمدة 60 ثانية وبعدين بيتجدد تلقائياً — بدل force-dynamic اللي كانت بتعمل استعلام جديد
// للداتابيز في *كل* زيارة (مفيش كاشينج خالص) ودة كانت سبب رئيسي في ضرب
// الـ monthly query limit بتاع الداتابيز. 60 ثانية فرق محسوسش عملياً للزائر
// (الستوك/السعر بيتحدث خلال دقيقة بالكتير لو الأدمن عدل حاجة)، بس بيوفر
// آلاف الاستعلامات على الصفحة الأكتر زيارة في الموقع.
export const revalidate = 60

export default function Home() {
  return (
    <div className={styles["home-root"]}>
      {/* ── HERO ── */}
      <HeroSection />

      {/* ── MARQUEE ── */}
      <MarqueeStrip />

      {/* ── BEST SELLERS ── */}
      <BestSellersSection />

      {/* ── NEW IN ── */}
      <NewInSection />

      {/* ── REVIEWS ── */}
      <ReviewsGallery />

      {/* ── REVIEWS CTA ── */}
      <ReviewsCta />

      {/* ── STATEMENT ── */}
      <StatementSection />

      {/* ── COMING SOON TEASER ── */}
      <ComingSoonTeaser />

      {/* ── CATEGORIES ── */}
      <CategoriesSection />

      {/* ── FOOTER STRIP ── */}
      <HomeFooterStrip />
    </div>
  )
}
