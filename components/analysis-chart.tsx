"use client"

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CATEGORY_COLORS } from "@/types/subscription"
import { calcMonthlyAmount, formatCurrency } from "@/lib/subscription-helpers"
import type { BillingCycle } from "@/types/subscription"

interface Subscription {
  id: string
  name: string
  amount: number
  currency: string
  billingCycle: string
  category: string
  usageRating?: number | null
}

interface Props {
  subscriptions: Subscription[]
}

function getQuadrantLabel(rating: number, monthly: number, avgMonthly: number): string {
  const isHighCost = monthly >= avgMonthly
  const isHighUsage = rating >= 4
  if (isHighCost && isHighUsage) return "コスパ良"
  if (isHighCost && !isHighUsage) return "要検討"
  if (!isHighCost && isHighUsage) return "優良"
  return "見直し候補"
}

function getQuadrantColor(label: string): string {
  const colors: Record<string, string> = {
    "コスパ良": "#10b981",
    "要検討": "#ef4444",
    "優良": "#3b82f6",
    "見直し候補": "#f59e0b",
  }
  return colors[label] ?? "#64748b"
}

export function UsageValueMatrix({ subscriptions }: Props) {
  const withRating = subscriptions.filter((s) => s.usageRating)
  const avgMonthly =
    withRating.reduce((sum, s) => sum + calcMonthlyAmount(s.amount, s.billingCycle as BillingCycle), 0) /
    (withRating.length || 1)

  const data = withRating.map((s) => {
    const monthly = calcMonthlyAmount(s.amount, s.billingCycle as BillingCycle)
    const label = getQuadrantLabel(s.usageRating!, monthly, avgMonthly)
    return {
      name: s.name,
      usage: s.usageRating,
      monthly,
      label,
      color: getQuadrantColor(label),
    }
  })

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">使用頻度 × 費用マトリックス</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          使用頻度を設定したサブスクがありません
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">使用頻度 × 費用マトリックス</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="usage"
              type="number"
              domain={[0.5, 5.5]}
              ticks={[1, 2, 3, 4, 5]}
              name="使用頻度"
              label={{ value: "使用頻度", position: "bottom", offset: 0 }}
            />
            <YAxis
              dataKey="monthly"
              name="月額"
              tickFormatter={(v) => `¥${Math.round(v / 100) * 100}`}
              label={{ value: "月額", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ payload }) => {
                if (!payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="bg-card border rounded-lg p-3 shadow text-sm">
                    <p className="font-medium">{d.name}</p>
                    <p>月額: {formatCurrency(d.monthly)}</p>
                    <p>使用頻度: {"★".repeat(d.usage)}</p>
                    <p
                      style={{ color: d.color }}
                      className="font-medium mt-1"
                    >
                      {d.label}
                    </p>
                  </div>
                )
              }}
            />
            <Scatter data={data} fill="#8884d8">
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        <div className="flex flex-wrap gap-3 mt-3">
          {[
            { label: "コスパ良", desc: "高頻度・高費用", color: "#10b981" },
            { label: "優良", desc: "高頻度・低費用", color: "#3b82f6" },
            { label: "要検討", desc: "低頻度・高費用", color: "#ef4444" },
            { label: "見直し候補", desc: "低頻度・低費用", color: "#f59e0b" },
          ].map((q) => (
            <div key={q.label} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: q.color }} />
              <span className="font-medium">{q.label}</span>
              <span className="text-muted-foreground">（{q.desc}）</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function AnnualCostTable({ subscriptions }: Props) {
  const rows = subscriptions
    .map((s) => ({
      ...s,
      monthly: calcMonthlyAmount(s.amount, s.billingCycle as BillingCycle),
      yearly:
        s.billingCycle === "yearly"
          ? s.amount
          : s.billingCycle === "weekly"
          ? s.amount * 52
          : s.amount * 12,
    }))
    .sort((a, b) => b.yearly - a.yearly)

  const totalYearly = rows.reduce((sum, r) => sum + r.yearly, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">年間費用一覧</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs">
                <th className="text-left pb-2">サービス</th>
                <th className="text-right pb-2">月額</th>
                <th className="text-right pb-2">年額</th>
                <th className="text-right pb-2">頻度</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[row.category] ?? "#64748b" }}
                      />
                      <span className="truncate max-w-[120px]">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-2 text-right">{formatCurrency(row.monthly)}</td>
                  <td className="py-2 text-right font-medium">{formatCurrency(row.yearly)}</td>
                  <td className="py-2 text-right text-yellow-500">
                    {"★".repeat(row.usageRating ?? 0)}
                    {"☆".repeat(5 - (row.usageRating ?? 0))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-bold">
                <td className="pt-2">合計</td>
                <td className="pt-2 text-right">
                  {formatCurrency(totalYearly / 12)}
                </td>
                <td className="pt-2 text-right">{formatCurrency(totalYearly)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
