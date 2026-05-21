import { addDays, addMonths, addWeeks, addYears, differenceInDays, isSameMonth } from "date-fns"
import type { BillingCycle } from "@/types/subscription"

export function calcMonthlyAmount(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case "monthly": return amount
    case "yearly": return amount / 12
    case "weekly": return (amount * 52) / 12
  }
}

export function calcYearlyAmount(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case "monthly": return amount * 12
    case "yearly": return amount
    case "weekly": return amount * 52
  }
}

export function getNextPaymentDate(date: Date, cycle: BillingCycle): Date {
  switch (cycle) {
    case "monthly": return addMonths(date, 1)
    case "yearly": return addYears(date, 1)
    case "weekly": return addWeeks(date, 1)
  }
}

export function getDaysUntilPayment(nextPaymentDate: Date): number {
  return differenceInDays(new Date(nextPaymentDate), new Date())
}

export function getUpcomingPayments<T extends { nextPaymentDate: Date | string; status: string }>(
  subscriptions: T[],
  days: number
): T[] {
  return subscriptions
    .filter((s) => s.status === "active")
    .filter((s) => {
      const d = getDaysUntilPayment(new Date(s.nextPaymentDate))
      return d >= 0 && d <= days
    })
    .sort(
      (a, b) =>
        new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime()
    )
}

export function groupByCategory<
  T extends { category: string; amount: number; billingCycle: string }
>(subscriptions: T[]): { category: string; totalAmount: number; count: number }[] {
  const map = new Map<string, { totalAmount: number; count: number }>()
  for (const s of subscriptions) {
    const monthly = calcMonthlyAmount(s.amount, s.billingCycle as BillingCycle)
    const existing = map.get(s.category) ?? { totalAmount: 0, count: 0 }
    map.set(s.category, {
      totalAmount: existing.totalAmount + monthly,
      count: existing.count + 1,
    })
  }
  return Array.from(map.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
}

export function getPaymentsForMonth<
  T extends { nextPaymentDate: Date | string; billingCycle: string; status: string }
>(subscriptions: T[], year: number, month: number): Map<string, T[]> {
  const result = new Map<string, T[]>()

  for (const sub of subscriptions) {
    if (sub.status === "cancelled") continue

    const baseDate = new Date(sub.nextPaymentDate)
    const targetDate = getPaymentDateInMonth(baseDate, sub.billingCycle as BillingCycle, year, month)

    if (targetDate) {
      const key = targetDate.toISOString().split("T")[0]
      const existing = result.get(key) ?? []
      result.set(key, [...existing, sub])
    }
  }

  return result
}

function getPaymentDateInMonth(
  nextPaymentDate: Date,
  cycle: BillingCycle,
  year: number,
  month: number
): Date | null {
  const targetMonthStart = new Date(year, month, 1)
  const targetMonthEnd = new Date(year, month + 1, 0)

  let current = new Date(nextPaymentDate)

  // 未来に進める
  while (current < targetMonthStart) {
    current = getNextPaymentDate(current, cycle)
  }

  // 過去に戻す
  if (cycle !== "yearly") {
    while (current > targetMonthEnd) {
      return null
    }
  }

  if (current >= targetMonthStart && current <= targetMonthEnd) {
    return current
  }

  return null
}

export function formatCurrency(amount: number, currency = "JPY"): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.round(amount))
}
