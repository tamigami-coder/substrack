import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { subscriptionSchema } from "@/lib/validations/subscription"
import { advanceToFuture } from "@/lib/date-utils"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    orderBy: { nextPaymentDate: "asc" },
  })

  const today = new Date()

  // 次回支払日が過去のアクティブなサブスクを自動更新
  const stale = subscriptions.filter(
    (s) => s.status === "active" && new Date(s.nextPaymentDate) <= today
  )
  if (stale.length > 0) {
    await Promise.all(
      stale.map((s) =>
        prisma.subscription.update({
          where: { id: s.id },
          data: { nextPaymentDate: advanceToFuture(new Date(s.nextPaymentDate), s.billingCycle) },
        })
      )
    )
    // 更新後のデータを再取得して返す
    const updated = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { nextPaymentDate: "asc" },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json(subscriptions)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const result = subscriptionSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const data = result.data
  const subscription = await prisma.subscription.create({
    data: {
      ...data,
      nextPaymentDate: advanceToFuture(new Date(data.nextPaymentDate), data.billingCycle),
      startDate: new Date(data.startDate),
      userId: session.user.id,
    },
  })

  return NextResponse.json(subscription, { status: 201 })
}
