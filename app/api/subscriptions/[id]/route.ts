import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { subscriptionSchema } from "@/lib/validations/subscription"
import { advanceToFuture } from "@/lib/date-utils"

async function getSubscription(id: string, userId: string) {
  return prisma.subscription.findFirst({
    where: { id, userId },
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const subscription = await getSubscription(id, session.user.id)
  if (!subscription) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(subscription)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const existing = await getSubscription(id, session.user.id)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const result = subscriptionSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const data = result.data
  const subscription = await prisma.subscription.update({
    where: { id },
    data: {
      ...data,
      nextPaymentDate: advanceToFuture(new Date(data.nextPaymentDate), data.billingCycle),
      startDate: new Date(data.startDate),
    },
  })

  return NextResponse.json(subscription)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const existing = await getSubscription(id, session.user.id)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.subscription.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
