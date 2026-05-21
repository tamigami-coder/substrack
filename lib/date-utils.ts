import { addMonths, addWeeks, addYears, isAfter, startOfDay } from "date-fns"

type BillingCycle = "monthly" | "yearly" | "weekly"

/**
 * 指定した基準日からサイクル分ずつ進め、今日より未来になる最初の日付を返す。
 * すでに未来の場合はそのまま返す。
 */
export function advanceToFuture(date: Date, billingCycle: BillingCycle | string): Date {
  const today = startOfDay(new Date())
  let next = startOfDay(new Date(date))

  while (!isAfter(next, today)) {
    if (billingCycle === "yearly") next = addYears(next, 1)
    else if (billingCycle === "weekly") next = addWeeks(next, 1)
    else next = addMonths(next, 1)
  }

  return next
}
