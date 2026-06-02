"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  CreditCard,
  Calendar,
  BarChart3,
  LogOut,
  User,
  Wallet,
  Upload,
  ShieldAlert, // [ADMIN TAB - 削除時はこの行も消す]
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "ダッシュボード" },
  { href: "/subscriptions", icon: CreditCard, label: "サブスク一覧" },
  { href: "/expenses", icon: Wallet, label: "支出一覧" },
  { href: "/calendar", icon: Calendar, label: "カレンダー" },
  { href: "/analysis", icon: BarChart3, label: "分析" },
  { href: "/import", icon: Upload, label: "CSVインポート" },
]

// ===== [ADMIN TAB START] 削除時: ここから [ADMIN TAB END] までを消す =====
const adminNavItem = { href: "/admin", icon: ShieldAlert, label: "管理者" }
// ===== [ADMIN TAB END] ====================================================

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="flex flex-col h-full w-64 bg-card border-r p-4">
      <div className="flex items-center gap-2 mb-8 px-2">
        <span className="text-2xl">💳</span>
        <span className="text-xl font-bold">SubsTrack</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          </Link>
        ))}
        {/* ===== [ADMIN TAB START] 削除時: ここから [ADMIN TAB END] までを消す ===== */}
        <Link href={adminNavItem.href}>
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mt-2",
              pathname === adminNavItem.href
                ? "bg-yellow-500 text-white"
                : "text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
            )}
          >
            <adminNavItem.icon className="h-4 w-4" />
            {adminNavItem.label}
          </div>
        </Link>
        {/* ===== [ADMIN TAB END] ===== */}
      </nav>

      <Separator className="my-4" />

      <div className="space-y-2">
        {session?.user && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="truncate">{session.user.name ?? session.user.email}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          ログアウト
        </Button>
      </div>
    </aside>
  )
}
