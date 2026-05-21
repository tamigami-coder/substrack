"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SubscriptionCard } from "@/components/subscription-card"
import { SubscriptionForm } from "@/components/subscription-form"
import { useSubscriptions } from "@/hooks/use-subscriptions"
import { CATEGORIES } from "@/types/subscription"
import type { SubscriptionInput } from "@/lib/validations/subscription"
import { calcMonthlyAmount, formatCurrency } from "@/lib/subscription-helpers"
import type { BillingCycle } from "@/types/subscription"

export default function SubscriptionsPage() {
  const { subscriptions, loading, refresh } = useSubscriptions()
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("active")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const editTarget = editId ? subscriptions.find((s) => s.id === editId) : null

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [subscriptions, statusFilter, categoryFilter, search])

  const totalMonthly = filtered
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + calcMonthlyAmount(s.amount, s.billingCycle as BillingCycle), 0)

  const handleAdd = async (data: SubscriptionInput) => {
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error()
    toast.success("サブスクを追加しました")
    setAddOpen(false)
    refresh()
  }

  const handleEdit = async (data: SubscriptionInput) => {
    if (!editId) return
    const res = await fetch(`/api/subscriptions/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error()
    toast.success("更新しました")
    setEditId(null)
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">サブスク一覧</h1>
          {!loading && (
            <p className="text-muted-foreground text-sm mt-1">
              表示中: {filtered.filter((s) => s.status === "active").length}件 /{" "}
              月額合計: {formatCurrency(totalMonthly)}
            </p>
          )}
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          追加
        </Button>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="サービス名で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger className="w-[140px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="カテゴリ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="active">アクティブ</TabsTrigger>
          <TabsTrigger value="paused">一時停止</TabsTrigger>
          <TabsTrigger value="cancelled">解約済み</TabsTrigger>
          <TabsTrigger value="all">すべて</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* リスト */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-5xl mb-4">📭</div>
          <p>サブスクがありません</p>
          {statusFilter === "active" && (
            <Button className="mt-4" onClick={() => setAddOpen(true)}>
              最初のサブスクを追加
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onEdit={(id) => setEditId(id)}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      {/* 追加ダイアログ */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>サブスクを追加</DialogTitle>
          </DialogHeader>
          <SubscriptionForm onSubmit={handleAdd} submitLabel="追加" />
        </DialogContent>
      </Dialog>

      {/* 編集ダイアログ */}
      <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>サブスクを編集</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <SubscriptionForm
              defaultValues={{
                ...editTarget,
                billingCycle: editTarget.billingCycle as "monthly" | "yearly" | "weekly",
                status: editTarget.status as "active" | "paused" | "cancelled",
                nextPaymentDate: editTarget.nextPaymentDate.split("T")[0],
                startDate: editTarget.startDate.split("T")[0],
                usageRating: editTarget.usageRating ?? undefined,
                notes: editTarget.notes ?? undefined,
                color: editTarget.color ?? "",
              }}
              onSubmit={handleEdit}
              submitLabel="更新"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
