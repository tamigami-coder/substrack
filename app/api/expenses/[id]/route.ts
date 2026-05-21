import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

async function getExpense(id: string, userId: string) {
  return prisma.expense.findFirst({ where: { id, userId } })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await getExpense(id, session.user.id)
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.expense.update({
    where: { id },
    data: {
      date: body.date ? new Date(body.date) : undefined,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      merchant: body.merchant,
      category: body.category,
      memo: body.memo ?? null,
    },
  })

  return Response.json(updated)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await getExpense(id, session.user.id)
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  await prisma.expense.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
