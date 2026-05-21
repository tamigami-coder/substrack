import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, getDaysUntilPayment } from "@/lib/subscription-helpers"
import { CATEGORY_COLORS } from "@/types/subscription"
import { cn } from "@/lib/utils"

interface Subscription {
  id: string
  name: string
  amount: number
  currency: string
  billingCycle: string
  nextPaymentDate: string
  category: string
}

interface Props {
  subscriptions: Subscription[]
}

export function UpcomingPayments({ subscriptions }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">直近の支払い（7日以内）</CardTitle>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            直近7日間の支払いはありません
          </p>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((sub) => {
              const days = getDaysUntilPayment(new Date(sub.nextPaymentDate))
              return (
                <div key={sub.id} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[sub.category] ?? "#64748b" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(sub.nextPaymentDate), "M月d日（E）", { locale: ja })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">
                      {formatCurrency(sub.amount, sub.currency)}
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        days === 0 && "text-red-600 font-medium",
                        days <= 3 && days > 0 && "text-orange-500",
                        days > 3 && "text-muted-foreground"
                      )}
                    >
                      {days === 0 ? "今日" : `あと${days}日`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
