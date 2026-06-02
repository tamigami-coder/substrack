import Iconv from "iconv-lite"
import Papa from "papaparse"
import type { ParsedTransaction } from "@/types/expense"

type Row = Record<string, string>

interface CardFormat {
  name: string
  detect: (headers: string[]) => boolean
  dateCol: string
  amountCol: string
  merchantCol: string
}

const CARD_FORMATS: CardFormat[] = [
  {
    name: "三井住友",
    detect: (h) => h.some((v) => v.includes("利用日")) && h.some((v) => v.includes("利用店名")),
    dateCol: "利用日",
    amountCol: "利用金額",
    merchantCol: "利用店名",
  },
  {
    name: "楽天カード",
    detect: (h) => h.some((v) => v.includes("利用日")) && h.some((v) => v.includes("利用店名・商品名")),
    dateCol: "利用日",
    amountCol: "利用金額（円）",
    merchantCol: "利用店名・商品名",
  },
  {
    name: "UFJカード（ヘッダーあり）",
    detect: (h) => h.some((v) => v.includes("取引日")) && h.some((v) => v.includes("摘要")),
    dateCol: "取引日",
    amountCol: "お支払い金額",
    merchantCol: "摘要",
  },
  {
    name: "イオンカード",
    detect: (h) => h.some((v) => v.includes("ご利用日")) && h.some((v) => v.includes("ご利用店名")),
    dateCol: "ご利用日",
    amountCol: "ご利用金額",
    merchantCol: "ご利用店名",
  },
]

// YYYY/MM/DD または YYYY-MM-DD 形式かどうか
const DATE_RE = /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/

function detectEncoding(buf: Buffer): BufferEncoding | "shift_jis" {
  for (let i = 0; i < buf.length - 1; i++) {
    const b = buf[i]
    if ((b >= 0x81 && b <= 0x9f) || (b >= 0xe0 && b <= 0xfc)) {
      return "shift_jis"
    }
  }
  return "utf8"
}

function detectFormat(headers: string[]): CardFormat | null {
  for (const fmt of CARD_FORMATS) {
    if (fmt.detect(headers)) return fmt
  }
  return null
}

function guessColumns(headers: string[]): { dateCol: string; amountCol: string; merchantCol: string } | null {
  const dateCol = headers.find((h) => /日付|日$|date/i.test(h))
  const amountCol = headers.find((h) => /金額|amount|円/i.test(h))
  const merchantCol = headers.find((h) => /店|商品|名称|摘要|description|merchant/i.test(h))
  if (dateCol && amountCol && merchantCol) return { dateCol, amountCol, merchantCol }
  return null
}

function parseDate(s: string): string {
  const clean = s.trim().replace(/[年\/]/g, "-").replace(/月/g, "-").replace(/日/g, "")
  const parts = clean.split("-").map((p) => p.trim())
  if (parts.length === 3) {
    const [y, m, d] = parts
    return `${y.padStart(4, "20")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }
  return new Date().toISOString().slice(0, 10)
}

function parseAmount(s: string): number {
  const n = Number(s.replace(/[,，￥¥\s]/g, ""))
  return isNaN(n) ? 0 : n
}

// ヘッダーなし形式（三菱UFJカード等）をカラム位置で解析
// 形式A: 日付, 店舗名, 利用金額, ...（index 2が金額）
// 形式B: 日付, 店舗名, 利用区分, 支払方法, -, 請求月, 金額, ...（index 6が金額）
function parseNoHeaderFormat(rows: string[][]): ParsedTransaction[] {
  const results: ParsedTransaction[] = []

  for (const cols of rows) {
    const dateStr = (cols[0] ?? "").trim()
    const merchant = (cols[1] ?? "").trim()

    // 日付っぽくない行（1行目のカード情報・合計行など）をスキップ
    if (!DATE_RE.test(dateStr)) continue
    if (!merchant) continue

    // index 2を試し、0なら後続列を順にスキャンして最初の正値を金額とする
    let amount = parseAmount((cols[2] ?? "").trim())
    if (amount <= 0) {
      for (let i = 3; i < cols.length; i++) {
        const v = (cols[i] ?? "").trim()
        if (!v) continue
        const n = parseAmount(v)
        if (n > 0) { amount = n; break }
      }
    }

    if (amount <= 0) continue

    results.push({
      date: parseDate(dateStr),
      merchant,
      amount,
      category: "その他",
    })
  }

  return results
}

export function parseCSV(buffer: Buffer): ParsedTransaction[] {
  const enc = detectEncoding(buffer)
  const text = enc === "shift_jis" ? Iconv.decode(buffer, "shift_jis") : buffer.toString("utf8")

  // BOM除去
  const csv = text.replace(/^﻿/, "")

  // --- 試行1: ヘッダーあり形式 ---
  const withHeader: Papa.ParseResult<Row> = Papa.parse<Row>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  })

  if (withHeader.data.length > 0) {
    const headers = Object.keys(withHeader.data[0])
    const fmt = detectFormat(headers)
    const cols = fmt ?? guessColumns(headers)

    if (cols) {
      const { dateCol, amountCol, merchantCol } = cols
      return withHeader.data
        .map((row: Row) => {
          const merchant = (row[merchantCol] ?? "").trim()
          const dateStr = (row[dateCol] ?? "").trim()
          const amountStr = (row[amountCol] ?? "").trim()

          if (!merchant || !dateStr || !amountStr) return null
          const amount = parseAmount(amountStr)
          if (amount <= 0) return null

          return {
            date: parseDate(dateStr),
            merchant,
            amount,
            category: "その他",
          } satisfies ParsedTransaction
        })
        .filter((t): t is ParsedTransaction => t !== null)
    }
  }

  // --- 試行2: ヘッダーなし形式（三菱UFJカード等） ---
  const noHeader: Papa.ParseResult<string[]> = Papa.parse<string[]>(csv, {
    header: false,
    skipEmptyLines: true,
  })

  return parseNoHeaderFormat(noHeader.data)
}

export function detectBillingMonth(buffer: Buffer): string | null {
  const enc = detectEncoding(buffer)
  const text = enc === "shift_jis" ? Iconv.decode(buffer, "shift_jis") : buffer.toString("utf8")

  // 先頭10行程度を調べる
  const lines = text.split(/\r?\n/).slice(0, 10)

  for (const line of lines) {
    // パターン1: "2026年05月26日お支払い分" または "2026年5月お支払い分"
    const m1 = line.match(/(\d{4})年(\d{1,2})月(?:\d{1,2}日)?お支払い分/)
    if (m1) {
      return `${m1[1]}-${m1[2].padStart(2, "0")}`
    }

    // パターン2: "支払日：2026/05/26" または "お支払日 2026-05-26"
    const m2 = line.match(/(?:支払日|引落日)[：:]?\s*(\d{4})[\/\-年](\d{1,2})[\/\-月]/)
    if (m2) {
      return `${m2[1]}-${m2[2].padStart(2, "0")}`
    }

    // パターン3: "2026年05月度" または "2026/05度"
    const m3 = line.match(/(\d{4})[\/\-年](\d{1,2})月?度/)
    if (m3) {
      return `${m3[1]}-${m3[2].padStart(2, "0")}`
    }
  }

  return null
}

