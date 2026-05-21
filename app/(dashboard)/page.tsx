"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import { CreditCard, Wallet, Calendar, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/dashboard-stats"
import { UpcomingPayments } from "@/components/upcoming-payments"
import { useSubscriptions } from "@/hooks/use-subscriptions"
import {
  calcMonthlyAmount,
  calcYearlyAmount,
  groupByCategory,
  getUpcomingPayments,
  formatCurrency,
} from "@/lib/subscription-helpers"
import type { BillingCycle } from "@/types/subscription"

const CategoryPieChart = dynamic(
  () => import("@/components/category-pie-chart").then((m) => m.CategoryPieChart),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full" /> }
)

export default function DashboardPage() {
  const { subscriptions, loading } = useSubscriptions()

  const active = useMemo(
    () => subscriptions.filter((s) => s.status === "active"),
    [subscriptions]
  )

  const monthlyTotal = useMemo(
    () => active.reduce((sum, s) => sum + calcMonthlyAmount(s.amount, s.billingCycle as BillingCycle), 0),
    [active]
  )

  const yearlyTotal = useMemo(
    () => active.reduce((sum, s) => sum + calcYearlyAmount(s.amount, s.billingCycle as BillingCycle), 0),
    [active]
  )

  const categoryData = useMemo(() => groupByCategory(active), [active])

  const upcomingThisMonth = useMemo(
    () =>
      active.filter((s) => {
        const d = new Date(s.nextPaymentDate)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }),
    [active]
  )

  const upcoming7Days = useMemo(() => getUpcomingPayments(active, 7), [active])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="今月の総支出（月額換算）"
          value={formatCurrency(monthlyTotal)}
          icon={Wallet}
        />
        <StatCard
          label="アクティブなサブスク"
          value={`${active.length}件`}
          icon={CreditCard}
        />
        <StatCard
          label="今月の支払い予定"
          value={`${upcomingThisMonth.length}件`}
          icon={Calendar}
        />
        <StatCard
          label="年間総支出予測"
          value={formatCurrency(yearlyTotal)}
          icon={TrendingUp}
          sub={`月平均 ${formatCurrency(yearlyTotal / 12)}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CategoryPieChart data={categoryData} />
        <UpcomingPayments subscriptions={upcoming7Days} />
      </div>

      {active.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="text-5xl mb-4">💳</div>
          <p className="text-lg font-medium">まだサブスクが登録されていません</p>
          <p className="text-sm mt-1">
            サブスク一覧から最初のサブスクを追加してみましょう
          </p>
        </div>
      )}
    </div>
  )
}
