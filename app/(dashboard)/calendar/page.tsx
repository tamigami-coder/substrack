"use client"

import { useState, useMemo } from "react"
import { format, addMonths, subMonths } from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PaymentCalendar } from "@/components/payment-calendar"
import { useSubscriptions } from "@/hooks/use-subscriptions"
import {
  calcMonthlyAmount,
  formatCurrency,
} from "@/lib/subscription-helpers"
import { CATEGORY_COLORS } from "@/types/subscription"
import type { BillingCycle } from "@/types/subscription"

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { subscriptions, loading } = useSubscriptions()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const active = useMemo(
    () => subscriptions.filter((s) => s.status !== "cancelled"),
    [subscriptions]
  )

  const handlePrev = () => setCurrentDate((d) => subMonths(d, 1))
  const handleNext = () => setCurrentDate((d) => addMonths(d, 1))
  const handleToday = () => setCurrentDate(new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">支払いカレンダー</h1>
        <Button variant="outline" size="sm" onClick={handleToday}>
          今月
        </Button>
      </div>

      {/* ナビゲーション */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handlePrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold min-w-[140px] text-center">
          {format(currentDate, "yyyy年M月", { locale: ja })}
        </h2>
        <Button variant="ghost" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-[500px] w-full" />
      ) : (
        <PaymentCalendar year={year} month={month} subscriptions={active} />
      )}

      {/* カテゴリ凡例 */}
      {!loading && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-3">カテゴリ</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-1.5 text-xs">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                  {cat}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
