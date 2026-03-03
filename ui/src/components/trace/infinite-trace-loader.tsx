"use client"

"use client"

import { type RefObject } from "react"

type Props = {
  loading: boolean
  hasMore: boolean
  error?: string | null
  sentinelRef: RefObject<HTMLDivElement | null>
}

export default function InfiniteTraceLoader({ loading, hasMore, error, sentinelRef }: Props) {
  return (
    <div className="space-y-2 py-2 text-center text-xs text-slate-500">
      {error && <p className="text-red-600">{error}</p>}
      {loading && <p>Loading more traces...</p>}
      {!loading && !hasMore && <p>All traces loaded</p>}
      <div ref={sentinelRef} className="h-2" />
    </div>
  )
}
