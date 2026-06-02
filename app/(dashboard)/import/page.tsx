"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { EXPENSE_CATEGORIES } from "@/types/expense"
import type { ParsedTransaction } from "@/types/expense"
import { format, addMonths } from "date-fns"
import { ja } from "date-fns/locale"

const CATEGORY_COLORS: Record<string, string> = {
  サブスク: "bg-purple-100 text-purple-800",
  食費: "bg-green-100 text-green-800",
  外食: "bg-orange-100 text-orange-800",
  交通費: "bg-blue-100 text-blue-800",
  日用品: "bg-yellow-100 text-yellow-800",
  医療費: "bg-red-100 text-red-800",
  "趣味・娯楽": "bg-pink-100 text-pink-800",
  光熱費: "bg-cyan-100 text-cyan-800",
  住居費: "bg-indigo-100 text-indigo-800",
  通信費: "bg-teal-100 text-teal-800",
  その他: "bg-gray-100 text-gray-600",
}

type Step = "upload" | "review" | "done"

export default function ImportPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>("upload")
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [billingMonth, setBillingMonth] = useState<string>("")

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("CSVファイルを選択してください")
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/import/csv", { method: "POST", body: form })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? "解析に失敗しました")
        return
      }
      const { transactions: parsed, detectedBillingMonth } = await res.json()
      setTransactions(parsed)
      setBillingMonth(detectedBillingMonth || format(new Date(), "yyyy-MM"))
      setSelected(new Set(parsed.map((_: ParsedTransaction, i: number) => i)))
      setStep("review")
    } catch {
      toast.error("ファイルの読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const updateCategory = (i: number, cat: string) => {
    setTransactions((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], category: cat }
      return next
    })
  }

  const handleConfirm = async () => {
    const toImport = transactions.filter((_, i) => selected.has(i))
    if (toImport.length === 0) {
      toast.error("取り込む取引を選択してください")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/import/csv/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: toImport, billingMonth }),
      })
      if (!res.ok) throw new Error()
      const { count } = await res.json()
      toast.success(`${count}件の取引を取り込みました`)
      setStep("done")
    } catch {
      toast.error("取り込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const subscriptionsInSelection = transactions.filter(
    (t, i) => selected.has(i) && t.category === "サブスク"
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CSVインポート</h1>
        <p className="text-muted-foreground text-sm mt-1">
          クレジットカードの明細CSVをアップロードして支出を自動取込します
        </p>
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center gap-2 text-sm">
        {(["upload", "review", "done"] as Step[]).map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                step === s
                  ? "bg-primary text-primary-foreground"
                  : idx < ["upload", "review", "done"].indexOf(step)
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {idx < ["upload", "review", "done"].indexOf(step) ? "✓" : idx + 1}
            </div>
            <span className={step === s ? "font-medium" : "text-muted-foreground"}>
              {s === "upload" ? "ファイル選択" : s === "review" ? "内容確認" : "完了"}
            </span>
            {idx < 2 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* ステップ1: アップロード */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>CSVファイルを選択</CardTitle>
            <CardDescription>
              三井住友・楽天カード・UFJカード・イオンカード等に対応。Shift-JIS / UTF-8 自動判別。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">クリックまたはドラッグ＆ドロップ</p>
              <p className="text-sm text-muted-foreground mt-1">CSVファイル (.csv)</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
            {loading && (
              <p className="text-center text-sm text-muted-foreground mt-4">解析中...</p>
            )}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">CSVの取得方法（例）</p>
              <p>・三井住友カード: Vpass → 利用明細 → CSVダウンロード</p>
              <p>・楽天カード: 楽天e-NAVI → 利用明細 → CSVダウンロード</p>
              <p>・UFJカード: MUFGポイントサイト → 明細照会 → CSV出力</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ステップ2: レビュー */}
      {step === "review" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                インポート対象月（この月の支出として集計します）
              </label>
              <div className="flex items-center gap-2">
                <Select value={billingMonth} onValueChange={(v) => v && setBillingMonth(v)}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="対象月を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const options = []
                      const now = new Date()
                      for (let i = -6; i <= 3; i++) {
                        const d = addMonths(now, i)
                        options.push({
                          value: format(d, "yyyy-MM"),
                          label: format(d, "yyyy年M月", { locale: ja }),
                        })
                      }
                      return options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))
                    })()}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {transactions.length}件を検出
                </p>
                <p className="text-xs text-muted-foreground">
                  {selected.size}件選択中
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelected(new Set(transactions.map((_, i) => i)))}>
                  全選択
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
                  全解除
                </Button>
              </div>
            </div>
          </div>

          {subscriptionsInSelection.length > 0 && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
              <p className="font-medium text-purple-800">
                {subscriptionsInSelection.length}件のサブスクが検出されました
              </p>
              <p className="text-purple-700 text-xs mt-0.5">
                インポート後、支出一覧から「サブスクとして登録」できます
              </p>
            </div>
          )}

          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-0 text-xs font-medium bg-muted px-4 py-2">
              <span className="w-6"></span>
              <span className="pl-3">店舗名</span>
              <span className="text-right pr-4">金額</span>
              <span className="w-32 text-center">カテゴリ</span>
            </div>
            <div className="divide-y max-h-[480px] overflow-y-auto">
              {transactions.map((t, i) => (
                <div
                  key={i}
                  className={cn(
                    "grid grid-cols-[auto_1fr_auto_auto] items-center gap-0 px-4 py-2.5 text-sm",
                    !selected.has(i) && "opacity-40"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggleSelect(i)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="pl-3">
                    <p className="font-medium truncate">{t.merchant}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(t.date), "M月d日", { locale: ja })}
                    </p>
                  </div>
                  <span className="text-right pr-4 font-medium tabular-nums">
                    ¥{t.amount.toLocaleString()}
                  </span>
                  <div className="w-32">
                    <Select value={t.category} onValueChange={(v) => v && updateCategory(i, v)}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c} className="text-xs">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => { setStep("upload"); setTransactions([]) }}>
              戻る
            </Button>
            <Button onClick={handleConfirm} disabled={loading || selected.size === 0}>
              {loading ? "取込中..." : `${selected.size}件を取り込む`}
            </Button>
          </div>
        </div>
      )}

      {/* ステップ3: 完了 */}
      {step === "done" && (
        <Card>
          <CardContent className="pt-10 pb-10 text-center space-y-4">
            <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
            <p className="text-xl font-semibold">取込完了</p>
            <p className="text-muted-foreground text-sm">支出一覧から内容を確認できます</p>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => router.push("/expenses")}>
                支出一覧を見る
              </Button>
              <Button onClick={() => { setStep("upload"); setTransactions([]) }}>
                続けて取り込む
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
