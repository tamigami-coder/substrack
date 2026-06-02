import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import type { ParsedTransaction } from "@/types/expense"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { transactions, billingMonth }: { transactions: ParsedTransaction[]; billingMonth?: string } = await req.json()
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return Response.json({ error: "取引データがありません" }, { status: 400 })
  }

  const getBillingDate = (dateStr: string) => {
    if (billingMonth) {
      const [y, m] = billingMonth.split("-")
      return new Date(Date.UTC(Number(y), Number(m) - 1, 1))
    }
    const d = new Date(dateStr)
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1))
  }

  await prisma.expense.createMany({
    data: transactions.map((t) => ({
      date: new Date(t.date),
      billingDate: getBillingDate(t.date),
      amount: t.amount,
      merchant: t.merchant,
      category: t.category,
      memo: t.memo ?? null,
      source: "csv",
      userId: session.user.id,
    })),
  })

  return Response.json({ count: transactions.length })
}
