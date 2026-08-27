// app/(store)/page.tsx
import { ReviewsGallery } from "@/components/ReviewsGallery"
import { HeroSection } from "@/components/home/HeroSection"
import { TrustStrip } from "@/components/home/TrustStrip"
import { MarqueeStrip } from "@/components/home/MarqueeStrip"
import { BestSellersSection } from "@/components/home/BestSellersSection"
import { NewInSection } from "@/components/home/NewInSection"
import { ReviewsCta } from "@/components/home/ReviewsCta"
import { StatementSection } from "@/components/home/StatementSection"
import { HomeFooterStrip } from "@/components/home/HomeFooterStrip"
import styles from "./home.module.css"

export const revalidate = 60

export default function Home() {
  return (
    <div className={styles["home-root"]}>
      <HeroSection />
      <TrustStrip />
      <BestSellersSection />
      <NewInSection />
      <MarqueeStrip />
      <ReviewsGallery />
      <ReviewsCta />
      <StatementSection />
      <HomeFooterStrip />
    </div>
  )
}
