"use client"

import { useState, useEffect, useCallback } from "react"

export interface Subscription {
  id: string
  name: string
  amount: number
  currency: string
  billingCycle: string
  nextPaymentDate: string
  startDate: string
  status: string
  category: string
  usageRating?: number | null
  notes?: string | null
  color?: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.fetch("/api/subscriptions")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setSubscriptions(data)
    } catch {
      setError("データの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { subscriptions, loading, error, refresh: fetch }
}
