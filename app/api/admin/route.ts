// ===== ADMIN API [削除手順: このファイルごと削除] =====
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { categorizeMerchants } from "@/lib/categorize"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const [subscriptionCount, expenseCount] = await Promise.all([
    prisma.subscription.count({ where: { userId: session.user.id } }),
    prisma.expense.count({ where: { userId: session.user.id } }),
  ])

  return Response.json({ subscriptionCount, expenseCount })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const target = searchParams.get("target")

  if (target === "subscriptions") {
    const { count } = await prisma.subscription.deleteMany({ where: { userId: session.user.id } })
    return Response.json({ deleted: count, target: "subscriptions" })
  }

  if (target === "expenses") {
    const { count } = await prisma.expense.deleteMany({ where: { userId: session.user.id } })
    return Response.json({ deleted: count, target: "expenses" })
  }

  if (target === "all") {
    const [subs, exps] = await Promise.all([
      prisma.subscription.deleteMany({ where: { userId: session.user.id } }),
      prisma.expense.deleteMany({ where: { userId: session.user.id } }),
    ])
    return Response.json({ deleted: { subscriptions: subs.count, expenses: exps.count }, target: "all" })
  }

  return Response.json({ error: "target は subscriptions / expenses / all のいずれかを指定" }, { status: 400 })
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const expenses = await prisma.expense.findMany({
    where: { userId: session.user.id },
    select: { id: true, merchant: true },
  })

  if (expenses.length === 0) return Response.json({ updated: 0 })

  const merchants = [...new Set(expenses.map((e) => e.merchant))]
  const categoryMap = await categorizeMerchants(merchants)

  await Promise.all(
    expenses.map((e) =>
      prisma.expense.update({
        where: { id: e.id },
        data: { category: categoryMap[e.merchant] ?? "その他" },
      })
    )
  )

  return Response.json({ updated: expenses.length })
}
