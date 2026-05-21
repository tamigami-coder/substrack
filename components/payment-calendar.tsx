"use client"

import { format, isSameDay, isToday, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"
import { ja } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { CATEGORY_COLORS } from "@/types/subscription"
import { formatCurrency } from "@/lib/subscription-helpers"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Subscription {
  id: string
  name: string
  amount: number
  currency: string
  billingCycle: string
  nextPaymentDate: string
  status: string
  category: string
}

interface Props {
  year: number
  month: number
  subscriptions: Subscription[]
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"]

function getPaymentDaysInMonth(
  subscriptions: Subscription[],
  year: number,
  month: number
): Map<string, Subscription[]> {
  const result = new Map<string, Subscription[]>()

  for (const sub of subscriptions) {
    if (sub.status === "cancelled") continue

    const base = new Date(sub.nextPaymentDate)
    const targetDates = getDatesInMonth(base, sub.billingCycle, year, month)

    for (const d of targetDates) {
      const key = format(d, "yyyy-MM-dd")
      const existing = result.get(key) ?? []
      result.set(key, [...existing, sub])
    }
  }

  return result
}

function getDatesInMonth(
  nextPaymentDate: Date,
  billingCycle: string,
  year: number,
  month: number
): Date[] {
  const results: Date[] = []
  const targetStart = new Date(year, month, 1)
  const targetEnd = new Date(year, month + 1, 0)

  let current = new Date(nextPaymentDate)

  if (billingCycle === "yearly") {
    // 年次は同月のみ
    if (current.getMonth() === month) {
      // 年が異なる場合は年を合わせる
      const adjusted = new Date(year, current.getMonth(), current.getDate())
      if (adjusted >= targetStart && adjusted <= targetEnd) {
        results.push(adjusted)
      }
    }
    return results
  }

  // 過去方向にさかのぼる
  while (current > targetEnd) {
    if (billingCycle === "monthly") {
      current = new Date(current.getFullYear(), current.getMonth() - 1, current.getDate())
    } else if (billingCycle === "weekly") {
      current = new Date(current.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }

  // 未来方向に進める
  while (current < targetStart) {
    if (billingCycle === "monthly") {
      current = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate())
    } else if (billingCycle === "weekly") {
      current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
  }

  while (current <= targetEnd) {
    results.push(new Date(current))
    if (billingCycle === "monthly") {
      current = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate())
    } else if (billingCycle === "weekly") {
      current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000)
    } else {
      break
    }
  }

  return results
}

export function PaymentCalendar({ year, month, subscriptions }: Props) {
  const monthStart = startOfMonth(new Date(year, month))
  const monthEnd = endOfMonth(monthStart)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const paymentMap = getPaymentDaysInMonth(subscriptions, year, month)

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={cn(
              "text-center text-xs font-medium py-3",
              i === 0 && "text-red-500",
              i === 6 && "text-blue-500",
              i > 0 && i < 6 && "text-muted-foreground"
            )}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const key = format(day, "yyyy-MM-dd")
          const payments = paymentMap.get(key) ?? []
          const isCurrentMonth = day.getMonth() === month
          const today = isToday(day)
          const dayOfWeek = day.getDay()

          return (
            <div
              key={key}
              className={cn(
                "min-h-[80px] border-b border-r p-1.5",
                !isCurrentMonth && "bg-muted/30",
                (idx + 1) % 7 === 0 && "border-r-0"
              )}
            >
              <div
                className={cn(
                  "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                  today && "bg-primary text-primary-foreground",
                  !today && !isCurrentMonth && "text-muted-foreground/50",
                  !today && isCurrentMonth && dayOfWeek === 0 && "text-red-500",
                  !today && isCurrentMonth && dayOfWeek === 6 && "text-blue-500",
                  !today && isCurrentMonth && dayOfWeek > 0 && dayOfWeek < 6 && "text-foreground"
                )}
              >
                {format(day, "d")}
              </div>

              <div className="space-y-0.5">
                {payments.slice(0, 3).map((sub) => (
                  <Tooltip key={sub.id}>
                    <TooltipTrigger
                      render={<div />}
                      className="text-xs px-1 py-0.5 rounded truncate cursor-default text-white w-full text-left"
                      style={{
                        backgroundColor: CATEGORY_COLORS[sub.category] ?? "#64748b",
                      }}
                    >
                      {sub.name}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{sub.name}</p>
                      <p>{formatCurrency(sub.amount, sub.currency)}</p>
                      <p className="text-xs opacity-75">{sub.category}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {payments.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1">
                    +{payments.length - 3}件
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
