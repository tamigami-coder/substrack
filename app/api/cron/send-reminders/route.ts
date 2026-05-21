import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendPaymentReminder } from "@/lib/push-notifications"
import { addDays } from "date-fns"

export async function GET() {
  const now = new Date()
  const in3Days = addDays(now, 3)
  const tomorrow = addDays(now, 1)

  const upcoming = await prisma.subscription.findMany({
    where: {
      status: "active",
      nextPaymentDate: {
        lte: in3Days,
        gte: now,
      },
    },
    include: {
      user: {
        include: { pushTokens: true },
      },
    },
  })

  let sent = 0
  let expired = 0

  for (const sub of upcoming) {
    for (const token of sub.user.pushTokens) {
      const result = await sendPaymentReminder(
        token,
        sub.name,
        sub.amount,
        sub.currency,
        new Date(sub.nextPaymentDate)
      )
      if (result === "expired") {
        await prisma.pushToken.delete({ where: { id: token.id } })
        expired++
      } else if (result) {
        sent++
      }
    }
  }

  return NextResponse.json({ sent, expired, checked: upcoming.length })
}
