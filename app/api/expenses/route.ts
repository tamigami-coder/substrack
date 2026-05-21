import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = searchParams.get("year")
  const month = searchParams.get("month")

  let dateFilter = {}
  if (year && month) {
    const start = new Date(Number(year), Number(month) - 1, 1)
    const end = new Date(Number(year), Number(month), 1)
    dateFilter = { date: { gte: start, lt: end } }
  }

  const expenses = await prisma.expense.findMany({
    where: { userId: session.user.id, ...dateFilter },
    orderBy: { date: "desc" },
  })

  return Response.json(expenses)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const expense = await prisma.expense.create({
    data: {
      date: new Date(body.date),
      amount: Number(body.amount),
      merchant: body.merchant,
      category: body.category,
      memo: body.memo ?? null,
      source: "manual",
      userId: session.user.id,
    },
  })

  return Response.json(expense, { status: 201 })
}
