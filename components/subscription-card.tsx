"use client"

import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Star, MoreVertical, Pencil, Pause, Play, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import {
  calcMonthlyAmount,
  getDaysUntilPayment,
  formatCurrency,
} from "@/lib/subscription-helpers"
import { CATEGORY_COLORS, STATUS_LABELS } from "@/types/subscription"
import type { BillingCycle, SubscriptionStatus } from "@/types/subscription"
import { useState } from "react"

// DropdownMenuがdialog系を持たないためAlertDialogは別に管理
interface Subscription {
  id: string
  name: string
  amount: number
  currency: string
  billingCycle: string
  nextPaymentDate: Date | string
  status: string
  category: string
  usageRating?: number | null
  notes?: string | null
}

interface Props {
  subscription: Subscription
  onEdit: (id: string) => void
  onRefresh: () => void
}

export function SubscriptionCard({ subscription: sub, onEdit, onRefresh }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  const monthly = calcMonthlyAmount(sub.amount, sub.billingCycle as BillingCycle)
  const daysUntil = getDaysUntilPayment(new Date(sub.nextPaymentDate))
  const categoryColor = CATEGORY_COLORS[sub.category] ?? "#64748b"

  const handleStatusToggle = async () => {
    const newStatus = sub.status === "active" ? "paused" : "active"
    const res = await fetch(`/api/subscriptions/${sub.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sub, status: newStatus, nextPaymentDate: sub.nextPaymentDate, startDate: sub.nextPaymentDate }),
    })
    if (res.ok) {
      toast.success(newStatus === "active" ? "再開しました" : "一時停止しました")
      onRefresh()
    }
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/subscriptions/${sub.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success(`${sub.name} を削除しました`)
      onRefresh()
    }
  }

  return (
    <>
      <Card className={cn("relative", sub.status === "cancelled" && "opacity-60")}>
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
          style={{ backgroundColor: categoryColor }}
        />
        <CardContent className="pl-5 pr-3 py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base truncate">{sub.name}</h3>
                <Badge variant="outline" className="text-xs shrink-0">
                  {sub.category}
                </Badge>
                <Badge
                  className={cn(
                    "text-xs shrink-0",
                    sub.status === "active" && "bg-green-100 text-green-800 border-green-200",
                    sub.status === "paused" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                    sub.status === "cancelled" && "bg-gray-100 text-gray-600 border-gray-200"
                  )}
                  variant="outline"
                >
                  {STATUS_LABELS[sub.status as SubscriptionStatus] ?? sub.status}
                </Badge>
              </div>

              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="font-medium text-foreground text-lg">
                  {formatCurrency(sub.amount, sub.currency)}
                  <span className="text-xs text-muted-foreground ml-1">
                    / {sub.billingCycle === "monthly" ? "月" : sub.billingCycle === "yearly" ? "年" : "週"}
                  </span>
                </span>
                {sub.billingCycle !== "monthly" && (
                  <span className="text-xs">
                    （月額換算: {formatCurrency(monthly, sub.currency)}）
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span>
                  次回:{" "}
                  {format(new Date(sub.nextPaymentDate), "M月d日", { locale: ja })}
                  {sub.status === "active" && (
                    <span
                      className={cn(
                        "ml-1",
                        daysUntil <= 3 && "text-red-500 font-medium",
                        daysUntil <= 7 && daysUntil > 3 && "text-orange-500"
                      )}
                    >
                      （{daysUntil >= 0 ? `あと${daysUntil}日` : `${Math.abs(daysUntil)}日超過`}）
                    </span>
                  )}
                </span>

                {sub.usageRating && (
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < sub.usageRating!
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </span>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(sub.id)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  編集
                </DropdownMenuItem>
                {sub.status !== "cancelled" && (
                  <DropdownMenuItem onClick={handleStatusToggle}>
                    {sub.status === "active" ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        一時停止
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        再開
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{sub.name} を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
