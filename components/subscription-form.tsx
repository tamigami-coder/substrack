"use client"

import { useEffect } from "react"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CalendarIcon, Star } from "lucide-react"
import { advanceToFuture } from "@/lib/date-utils"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { subscriptionSchema, type SubscriptionInput } from "@/lib/validations/subscription"
import { CATEGORIES } from "@/types/subscription"

interface Props {
  defaultValues?: Partial<SubscriptionInput>
  onSubmit: (data: SubscriptionInput) => Promise<void>
  submitLabel?: string
}

export function SubscriptionForm({ defaultValues, onSubmit, submitLabel = "保存" }: Props) {
  const form = useForm<SubscriptionInput>({
    resolver: zodResolver(subscriptionSchema) as Resolver<SubscriptionInput>,
    defaultValues: {
      name: "",
      amount: 0,
      currency: "JPY",
      billingCycle: "monthly",
      nextPaymentDate: format(new Date(), "yyyy-MM-dd"),
      startDate: format(new Date(), "yyyy-MM-dd"),
      status: "active",
      category: "",
      usageRating: undefined,
      notes: "",
      color: "",
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (defaultValues) {
      form.reset({ ...form.getValues(), ...defaultValues })
    }
  }, [])

  // startDate / billingCycle が変わるたびに nextPaymentDate を自動計算
  const watchedStartDate = useWatch({ control: form.control, name: "startDate" })
  const watchedBillingCycle = useWatch({ control: form.control, name: "billingCycle" })

  useEffect(() => {
    if (!watchedStartDate) return
    const next = advanceToFuture(new Date(watchedStartDate), watchedBillingCycle)
    form.setValue("nextPaymentDate", format(next, "yyyy-MM-dd"), { shouldValidate: false })
  }, [watchedStartDate, watchedBillingCycle])

  const handleSubmit = async (data: SubscriptionInput) => {
    try {
      await onSubmit(data)
    } catch {
      toast.error("保存に失敗しました")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>サービス名 *</FormLabel>
                <FormControl>
                  <Input placeholder="Netflix, Spotify..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>カテゴリ *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>金額 *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="1490"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>通貨</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="JPY">JPY（円）</SelectItem>
                    <SelectItem value="USD">USD（ドル）</SelectItem>
                    <SelectItem value="EUR">EUR（ユーロ）</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="billingCycle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>支払いサイクル *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="monthly">月次</SelectItem>
                    <SelectItem value="yearly">年次</SelectItem>
                    <SelectItem value="weekly">週次</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>開始日 *</FormLabel>
                <Popover>
                  <PopoverTrigger
                    className={cn(
                      "inline-flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value
                      ? format(new Date(field.value), "yyyy年M月d日", { locale: ja })
                      : "日付を選択"}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextPaymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>次回支払日（自動計算）</FormLabel>
                <div className="inline-flex h-9 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50 shrink-0" />
                  {field.value
                    ? format(new Date(field.value), "yyyy年M月d日", { locale: ja })
                    : "—"}
                </div>
                <p className="text-xs text-muted-foreground">開始日と支払いサイクルから自動計算されます</p>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ステータス</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">アクティブ</SelectItem>
                    <SelectItem value="paused">一時停止</SelectItem>
                    <SelectItem value="cancelled">解約済み</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="usageRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>使用頻度（1〜5）</FormLabel>
                <FormControl>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => field.onChange(n === field.value ? undefined : n)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={cn(
                            "h-6 w-6 transition-colors",
                            field.value && n <= field.value
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メモ</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="備考など..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "保存中..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
