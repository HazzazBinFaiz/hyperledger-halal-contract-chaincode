"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getTraceOfBatchPaginated, PoultryBatchTrace } from "@/lib/actions/batch"

type Options = {
  batchId?: number
  pageSize?: number
  enabled?: boolean
}

export function useInfiniteBatchTrace({ batchId, pageSize = 20, enabled = true }: Options) {
  const [traces, setTraces] = useState<PoultryBatchTrace[]>([])
  const [bookmark, setBookmark] = useState("")
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadingRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const loadMore = useCallback(async () => {
    if (!enabled || !batchId || loadingRef.current) return
    if (!hasMore && traces.length > 0) return

    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const page = await getTraceOfBatchPaginated(batchId, pageSize, bookmark)
      const incoming = page.records || []

      setTraces((prev) => {
        const map = new Map(prev.map((item) => [`${item.datetime}-${item.unit_id}-${item.action_code || item.action}`, item]))
        for (const trace of incoming) {
          map.set(`${trace.datetime}-${trace.unit_id}-${trace.action_code || trace.action}`, trace)
        }
        return [...map.values()].sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
      })

      setBookmark(page.bookmark || "")
      setHasMore(Boolean(page.bookmark))
    } catch (e) {
      console.error(e)
      setError("Failed to load trace")
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [batchId, bookmark, enabled, hasMore, pageSize, traces.length])

  const resetAndLoad = useCallback(() => {
    setTraces([])
    setBookmark("")
    setHasMore(false)
    setError(null)
    loadingRef.current = false
  }, [])

  useEffect(() => {
    resetAndLoad()
  }, [batchId, enabled, pageSize, resetAndLoad])

  useEffect(() => {
    if (!enabled || !batchId) return
    void loadMore()
  }, [batchId, enabled, loadMore])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore()
        }
      },
      { rootMargin: "300px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMore])

  return {
    traces,
    loading,
    hasMore,
    error,
    sentinelRef,
    loadMore,
    resetAndLoad,
  }
}
