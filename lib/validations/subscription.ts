import { z } from "zod"

export const subscriptionSchema = z.object({
  name: z.string().min(1, "サービス名は必須です").max(100),
  amount: z.number().positive("金額は正の数である必要があります"),
  currency: z.string(),
  billingCycle: z.enum(["monthly", "yearly", "weekly"]),
  nextPaymentDate: z.string().min(1, "次回支払日は必須です"),
  startDate: z.string().min(1, "開始日は必須です"),
  status: z.enum(["active", "paused", "cancelled"]),
  category: z.string().min(1, "カテゴリを選択してください"),
  usageRating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
  color: z.string().optional(),
})

export type SubscriptionInput = z.infer<typeof subscriptionSchema>
