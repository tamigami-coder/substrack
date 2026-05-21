"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Upload, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { EXPENSE_CATEGORIES } from "@/types/expense"
import type { Expense } from "@/types/expense"
import { SubscriptionForm } from "@/components/subscription-form"
import type { SubscriptionInput } from "@/lib/validations/subscription"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const CATEGORY_COLORS: Record<string, string> = {
  サブスク: "bg-purple-100 text-purple-800 border-purple-200",
  食費: "bg-green-100 text-green-800 border-green-200",
  外食: "bg-orange-100 text-orange-800 border-orange-200",
  交通費: "bg-blue-100 text-blue-800 border-blue-200",
  日用品: "bg-yellow-100 text-yellow-800 border-yellow-200",
  医療費: "bg-red-100 text-red-800 border-red-200",
  "趣味・娯楽": "bg-pink-100 text-pink-800 border-pink-200",
  光熱費: "bg-cyan-100 text-cyan-800 border-cyan-200",
  住居費: "bg-indigo-100 text-indigo-800 border-indigo-200",
  通信費: "bg-teal-100 text-teal-800 border-teal-200",
  その他: "bg-gray-100 text-gray-600 border-gray-200",
}

function groupByCategory(expenses: Expense[]) {
  return EXPENSE_CATEGORIES.map((cat) => ({
    category: cat,
    total: expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0),
  })).filter((g) => g.total > 0)
}

export default function ExpensesPage() {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [subscribeTarget, setSubscribeTarget] = useState<Expense | null>(null)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth() + 1
    const res = await fetch(`/api/expenses?year=${year}&month=${month}`)
    if (res.ok) setExpenses(await res.json())
    setLoading(false)
  }, [currentMonth])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("削除しました")
      fetchExpenses()
    }
    setDeleteTarget(null)
  }

  const handleRegisterSubscription = async (data: SubscriptionInput) => {
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast.success("サブスクとして登録しました")
      setSubscribeTarget(null)
    } else {
      throw new Error()
    }
  }

  const filtered = filterCategory === "all"
    ? expenses
    : expenses.filter((e) => e.category === filterCategory)

  const total = filtered.reduce((s, e) => s + e.amount, 0)
  const groups = groupByCategory(expenses)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">支出一覧</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/import")}>
            <Upload className="h-4 w-4 mr-1.5" />
            CSVインポート
          </Button>
        </div>
      </div>

      {/* 月ナビゲーション */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth((d) => subMonths(d, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-lg min-w-[120px] text-center">
          {format(currentMonth, "yyyy年M月", { locale: ja })}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth((d) => addMonths(d, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">今月の支出合計</p>
            <p className="text-2xl font-bold mt-1">¥{expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        {groups.slice(0, 3).map((g) => (
          <Card key={g.category}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{g.category}</p>
              <p className="text-xl font-bold mt-1">¥{g.total.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* カテゴリフィルター */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory("all")}
          className={cn(
            "px-3 py-1 rounded-full text-sm border transition-colors",
            filterCategory === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-input hover:bg-accent"
          )}
        >
          すべて ({expenses.length})
        </button>
        {groups.map((g) => (
          <button
            key={g.category}
            onClick={() => setFilterCategory(g.category)}
            className={cn(
              "px-3 py-1 rounded-full text-sm border transition-colors",
              filterCategory === g.category
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input hover:bg-accent"
            )}
          >
            {g.category} (¥{g.total.toLocaleString()})
          </button>
        ))}
      </div>

      {/* 取引一覧 */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>この月の支出データがありません</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/import")}>
            CSVをインポートする
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="divide-y">
            {filtered.map((expense) => (
              <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{expense.merchant}</span>
                    <Badge
                      variant="outline"
                      className={cn("text-xs shrink-0", CATEGORY_COLORS[expense.category] ?? "")}
                    >
                      {expense.category}
                    </Badge>
                    {expense.source === "csv" && (
                      <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">
                        CSV
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(expense.date), "M月d日", { locale: ja })}
                    {expense.memo && ` · ${expense.memo}`}
                  </p>
                </div>
                <span className="font-medium tabular-nums shrink-0">
                  ¥{expense.amount.toLocaleString()}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {expense.category === "サブスク" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-purple-700 border-purple-300 hover:bg-purple-50"
                      onClick={() => setSubscribeTarget(expense)}
                    >
                      サブスク登録
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget(expense.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この支出を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>この操作は元に戻せません。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* サブスク登録ダイアログ */}
      <Dialog open={!!subscribeTarget} onOpenChange={() => setSubscribeTarget(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>サブスクとして登録</DialogTitle>
          </DialogHeader>
          {subscribeTarget && (
            <SubscriptionForm
              defaultValues={{
                name: subscribeTarget.merchant,
                amount: subscribeTarget.amount,
                billingCycle: "monthly",
                nextPaymentDate: format(addMonths(new Date(subscribeTarget.date), 1), "yyyy-MM-dd"),
                startDate: format(new Date(subscribeTarget.date), "yyyy-MM-dd"),
                status: "active",
                category: "その他",
              }}
              onSubmit={handleRegisterSubscription}
              submitLabel="サブスクとして登録"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
