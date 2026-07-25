import AnnouncementBar from "@/components/AnnouncementBar"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <main className="pt-[84px]">
        {children}
      </main>
      <Footer />
    </>
  )
}