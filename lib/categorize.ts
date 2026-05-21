import { classifyByDictionary } from "./merchant-dictionary"
import { EXPENSE_CATEGORIES } from "@/types/expense"

export async function categorizeMerchants(
  merchants: string[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  const unknown: string[] = []

  for (const merchant of merchants) {
    const cat = classifyByDictionary(merchant)
    if (cat) {
      result[merchant] = cat
    } else {
      unknown.push(merchant)
    }
  }

  if (unknown.length > 0 && process.env.ANTHROPIC_API_KEY) {
    try {
      const aiResults = await classifyWithClaude(unknown)
      Object.assign(result, aiResults)
    } catch {
      for (const m of unknown) result[m] = "その他"
    }
  } else {
    for (const m of unknown) result[m] = "その他"
  }

  return result
}

async function classifyWithClaude(merchants: string[]): Promise<Record<string, string>> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const categories = EXPENSE_CATEGORIES.join("、")
  const list = merchants.map((m, i) => `${i + 1}. ${m}`).join("\n")

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `以下の店舗名・サービス名を、指定カテゴリのいずれかに分類してください。
カテゴリ: ${categories}

店舗名リスト:
${list}

回答はJSON形式で返してください。例: {"1": "外食", "2": "サブスク"}
番号をキー、カテゴリを値にしてください。`,
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return Object.fromEntries(merchants.map((m) => [m, "その他"]))

  const parsed: Record<string, string> = JSON.parse(jsonMatch[0])
  const result: Record<string, string> = {}
  merchants.forEach((merchant, i) => {
    const cat = parsed[String(i + 1)]
    result[merchant] = (EXPENSE_CATEGORIES as readonly string[]).includes(cat) ? cat : "その他"
  })
  return result
}
