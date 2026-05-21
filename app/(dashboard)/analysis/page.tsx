"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSubscriptions } from "@/hooks/use-subscriptions"
import {
  calcMonthlyAmount,
  calcYearlyAmount,
  formatCurrency,
} from "@/lib/subscription-helpers"
import type { BillingCycle } from "@/types/subscription"

const UsageValueMatrix = dynamic(
  () => import("@/components/analysis-chart").then((m) => m.UsageValueMatrix),
  { ssr: false, loading: () => <Skeleton className="h-80 w-full" /> }
)

const AnnualCostTable = dynamic(
  () => import("@/components/analysis-chart").then((m) => m.AnnualCostTable),
  { ssr: false, loading: () => <Skeleton className="h-80 w-full" /> }
)

export default function AnalysisPage() {
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

  const worstValue = useMemo(() => {
    return active
      .filter((s) => s.usageRating && s.usageRating <= 2)
      .sort((a, b) =>
        calcMonthlyAmount(b.amount, b.billingCycle as BillingCycle) -
        calcMonthlyAmount(a.amount, a.billingCycle as BillingCycle)
      )
      .slice(0, 3)
  }, [active])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">分析</h1>
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">分析</h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">月間支出</p>
            <p className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">年間支出（予測）</p>
            <p className="text-2xl font-bold">{formatCurrency(yearlyTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">1日あたりのコスト</p>
            <p className="text-2xl font-bold">
              {formatCurrency(yearlyTotal / 365)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 要注意サブスク */}
      {worstValue.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-base text-orange-700">
              ⚠️ コスパ要注意のサブスク
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              使用頻度が低いのに費用が高いサブスクです。解約・プランダウンを検討してみましょう。
            </p>
            <div className="space-y-2">
              {worstValue.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">
                    月額 {formatCurrency(calcMonthlyAmount(s.amount, s.billingCycle as BillingCycle))} /{" "}
                    使用頻度: {"★".repeat(s.usageRating ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="matrix">
        <TabsList>
          <TabsTrigger value="matrix">使用頻度×費用</TabsTrigger>
          <TabsTrigger value="annual">年間費用一覧</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="mt-4">
          <UsageValueMatrix subscriptions={active} />
        </TabsContent>

        <TabsContent value="annual" className="mt-4">
          <AnnualCostTable subscriptions={active} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
