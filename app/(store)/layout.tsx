import AnnouncementBar from "@/components/AnnouncementBar"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
// OfferPopup مقفول مؤقتًا بطلب محمد — الكومبوننت لسه موجود بالكامل في
// components/OfferPopup.tsx، مجرد مش متركب هنا. لإرجاعه: رجّع الـ import
// وسطر <OfferPopup /> تحت.
// import OfferPopup from "@/components/OfferPopup"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main className="pt-[90px]">
        {children}
      </main>
      <Footer />
      {/* <OfferPopup /> */}
    </>
  )
}