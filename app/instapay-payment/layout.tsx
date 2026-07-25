import AnnouncementBar from "@/components/AnnouncementBar"
import Navbar from "@/components/Navbar"

export default function InstapayPaymentLayout({
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
    </>
  )
}