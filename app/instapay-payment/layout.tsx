import Navbar from "@/components/Navbar"

export default function InstapayPaymentLayout({
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
    </>
  )
}