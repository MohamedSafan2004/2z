import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main className="pt-14">
        {children}
      </main>
      <Footer />
    </>
  )
}