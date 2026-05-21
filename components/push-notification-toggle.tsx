"use client"

import { Bell, BellOff } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { usePushNotification } from "@/hooks/use-push-notification"

export function PushNotificationToggle() {
  const { permission, subscribed, loading, subscribe, unsubscribe } = usePushNotification()

  if (typeof window === "undefined" || !("Notification" in window)) {
    return null
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="h-4 w-4" />
        <span>通知はブラウザでブロックされています</span>
      </div>
    )
  }

  const handleToggle = async (checked: boolean) => {
    try {
      if (checked) {
        await subscribe()
        toast.success("支払いリマインダー通知をONにしました")
      } else {
        await unsubscribe()
        toast.info("支払いリマインダー通知をOFFにしました")
      }
    } catch {
      toast.error("通知設定の変更に失敗しました")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Bell className="h-4 w-4 text-muted-foreground" />
      <Label htmlFor="push-toggle" className="text-sm cursor-pointer">
        支払いリマインダー通知
      </Label>
      <Switch
        id="push-toggle"
        checked={subscribed}
        onCheckedChange={handleToggle}
        disabled={loading}
      />
    </div>
  )
}
