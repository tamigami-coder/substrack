import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* PC サイドバー */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* メインエリア */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* モバイルヘッダー */}
        <header className="flex items-center gap-2 p-4 border-b md:hidden">
          <MobileNav />
          <span className="font-bold">💳 SubsTrack</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
