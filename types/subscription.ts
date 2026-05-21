export type BillingCycle = "monthly" | "yearly" | "weekly"
export type SubscriptionStatus = "active" | "paused" | "cancelled"

export const CATEGORIES = [
  "動画配信",
  "音楽",
  "ゲーム",
  "クラウド",
  "生産性",
  "ニュース",
  "フィットネス",
  "その他",
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_COLORS: Record<string, string> = {
  動画配信: "#ef4444",
  音楽: "#8b5cf6",
  ゲーム: "#f59e0b",
  クラウド: "#3b82f6",
  生産性: "#10b981",
  ニュース: "#6b7280",
  フィットネス: "#ec4899",
  その他: "#64748b",
}

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "月次",
  yearly: "年次",
  weekly: "週次",
}

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "アクティブ",
  paused: "一時停止",
  cancelled: "解約済み",
}

export const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-gray-100 text-gray-600",
}

export interface SubscriptionFormData {
  name: string
  amount: number
  currency: string
  billingCycle: BillingCycle
  nextPaymentDate: string
  startDate: string
  status: SubscriptionStatus
  category: string
  usageRating?: number
  notes?: string
  color?: string
}
