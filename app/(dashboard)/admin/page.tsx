// ===== ADMIN PAGE [削除手順: このファイルごと削除] =====
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Trash2, RefreshCw, ShieldAlert, Database, Tags } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

type Stats = {
  subscriptionCount: number
  expenseCount: number
}

type DeleteTarget = "subscriptions" | "expenses" | "all" | null

const DELETE_CONFIG: Record<NonNullable<DeleteTarget>, { label: string; description: string; className: string }> = {
  subscriptions: {
    label: "サブスクを全削除",
    description: "登録されているサブスクリプションをすべて削除します。この操作は取り消せません。",
    className: "bg-orange-600 hover:bg-orange-700 text-white",
  },
  expenses: {
    label: "支出を全削除",
    description: "インポート・手動登録した支出データをすべて削除します。この操作は取り消せません。",
    className: "bg-orange-600 hover:bg-orange-700 text-white",
  },
  all: {
    label: "全データを削除",
    description: "サブスク・支出データをすべて削除します。この操作は取り消せません。",
    className: "bg-red-600 hover:bg-red-700 text-white",
  },
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
  const [deleting, setDeleting] = useState(false)
  const [recategorizing, setRecategorizing] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin")
      if (!res.ok) throw new Error()
      setStats(await res.json())
    } catch {
      toast.error("データ件数の取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  async function handleRecategorize() {
    setRecategorizing(true)
    try {
      const res = await fetch("/api/admin", { method: "POST" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success(`再分類完了: ${data.updated}件を更新しました`)
      router.refresh()
    } catch {
      toast.error("再分類に失敗しました")
    } finally {
      setRecategorizing(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin?target=${deleteTarget}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (deleteTarget === "all") {
        toast.success(`削除完了: サブスク ${data.deleted.subscriptions}件・支出 ${data.deleted.expenses}件`)
      } else {
        toast.success(`削除完了: ${data.deleted}件`)
      }
      await fetchStats()
      router.refresh()
    } catch {
      toast.error("削除に失敗しました")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-6 w-6 text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold">管理者パネル</h1>
          <p className="text-sm text-muted-foreground">開発用の一時的な管理機能です</p>
        </div>
      </div>

      {/* データ件数 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            現在のデータ件数
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-3xl font-bold">{stats.subscriptionCount}</p>
                <p className="text-sm text-muted-foreground mt-1">サブスク</p>
              </div>
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-3xl font-bold">{stats.expenseCount}</p>
                <p className="text-sm text-muted-foreground mt-1">支出</p>
              </div>
            </div>
          ) : null}
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            再読み込み
          </Button>
        </CardContent>
      </Card>

      {/* カテゴリ再分類 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Tags className="h-4 w-4" />
            カテゴリ再分類
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            既存の支出データを最新の辞書で再分類します。カテゴリの修正後にお使いください。
          </p>
          <Button
            className="w-full"
            onClick={handleRecategorize}
            disabled={recategorizing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${recategorizing ? "animate-spin" : ""}`} />
            {recategorizing ? "再分類中..." : "支出カテゴリを再分類する"}
          </Button>
        </CardContent>
      </Card>

      {/* データ削除 */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            データ削除
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">サブスクを全削除</p>
              <p className="text-xs text-muted-foreground">{stats ? `${stats.subscriptionCount}件` : "..."}</p>
            </div>
            <Button variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-50"
              onClick={() => setDeleteTarget("subscriptions")}>
              削除
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">支出を全削除</p>
              <p className="text-xs text-muted-foreground">{stats ? `${stats.expenseCount}件` : "..."}</p>
            </div>
            <Button variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-50"
              onClick={() => setDeleteTarget("expenses")}>
              削除
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <div>
              <p className="text-sm font-medium text-destructive">全データを削除</p>
              <p className="text-xs text-muted-foreground">サブスク + 支出をまとめて削除</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setDeleteTarget("all")}>
              全削除
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 確認ダイアログ */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? DELETE_CONFIG[deleteTarget].description : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className={deleteTarget ? DELETE_CONFIG[deleteTarget].className : ""}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
