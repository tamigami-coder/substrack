import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { parseCSV } from "@/lib/csv-parser"
import { categorizeMerchants } from "@/lib/categorize"
import { prisma } from "@/lib/db"
import type { ParsedTransaction } from "@/types/expense"

// CSV解析 → カテゴリ推定（未コミット）
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return Response.json({ error: "ファイルが見つかりません" }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const transactions = parseCSV(buffer)

  if (transactions.length === 0) {
    return Response.json({ error: "取引データが読み取れませんでした" }, { status: 400 })
  }

  const merchants = [...new Set(transactions.map((t) => t.merchant))]
  const categoryMap = await categorizeMerchants(merchants)

  const result: ParsedTransaction[] = transactions.map((t) => ({
    ...t,
    category: categoryMap[t.merchant] ?? "その他",
  }))

  return Response.json({ transactions: result })
}
