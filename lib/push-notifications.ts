import webpush from "web-push"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

if (
  process.env.VAPID_EMAIL &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function sendPaymentReminder(
  token: { endpoint: string; p256dh: string; auth: string },
  subscriptionName: string,
  amount: number,
  currency: string,
  nextPaymentDate: Date
) {
  const amountStr = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount)

  const dateStr = format(nextPaymentDate, "M月d日（E）", { locale: ja })

  const payload = JSON.stringify({
    title: `${subscriptionName} の支払いが近づいています`,
    body: `${dateStr} に ${amountStr} の支払いがあります`,
    url: "/subscriptions",
  })

  try {
    await webpush.sendNotification(
      { endpoint: token.endpoint, keys: { p256dh: token.p256dh, auth: token.auth } },
      payload
    )
    return true
  } catch (err: unknown) {
    const error = err as { statusCode?: number }
    if (error.statusCode === 410 || error.statusCode === 404) {
      return "expired"
    }
    return false
  }
}
