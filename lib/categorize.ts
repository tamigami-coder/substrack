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

  if (unknown.length > 0 && process.env.GEMINI_API_KEY) {
    try {
      const aiResults = await classifyWithGemini(unknown)
      Object.assign(result, aiResults)
    } catch {
      for (const m of unknown) result[m] = "その他"
    }
  } else {
    for (const m of unknown) result[m] = "その他"
  }

  return result
}

async function classifyWithGemini(merchants: string[]): Promise<Record<string, string>> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai")
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

  const categories = EXPENSE_CATEGORIES.join("、")
  const list = merchants.map((m, i) => `${i + 1}. ${m}`).join("\n")

  const prompt = `以下の店舗名・サービス名を、指定カテゴリのいずれかに分類してください。
カテゴリ: ${categories}

店舗名リスト:
${list}

回答はJSON形式のみで返してください。例: {"1": "外食", "2": "サブスク"}
番号をキー、カテゴリを値にしてください。`

  const response = await model.generateContent(prompt)
  const text = response.response.text()
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
