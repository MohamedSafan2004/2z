import Navbar from "@/components/Navbar"

export default function AdminLayout({
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