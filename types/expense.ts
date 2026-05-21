export const EXPENSE_CATEGORIES = [
  "サブスク",
  "食費",
  "外食",
  "交通費",
  "日用品",
  "医療費",
  "趣味・娯楽",
  "光熱費",
  "住居費",
  "通信費",
  "その他",
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export interface ParsedTransaction {
  date: string
  merchant: string
  amount: number
  category: string
  memo?: string
}

export interface Expense {
  id: string
  date: string | Date
  amount: number
  merchant: string
  category: string
  memo?: string | null
  source: string
  userId: string
  createdAt: string | Date
}
