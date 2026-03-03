"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getBatchById,
  getProcessedBatchesByBatchId,
  PoultryBatch,
  ProcessedBatch,
} from "@/lib/actions/batch"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { BatchTraceView } from "@/components/trace/trace-views"
import InfiniteTraceLoader from "@/components/trace/infinite-trace-loader"
import { useInfiniteBatchTrace } from "@/hooks/use-infinite-batch-trace"

export default function BatchTracePage() {
  const searchParams = useSearchParams()
  const paramBatchId = searchParams.get("id")
  const [batchId, setBatchId] = useState(paramBatchId || "")
  const [batch, setBatch] = useState<PoultryBatch | null>(null)
  const [units, setUnits] = useState<ProcessedBatch[]>([])
  const [loadingMeta, setLoadingMeta] = useState(false)

  const numericBatchId = useMemo(() => {
    const parsed = Number(batchId || paramBatchId)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }, [batchId, paramBatchId])

  const tracePagination = useInfiniteBatchTrace({
    batchId: numericBatchId,
    pageSize: 20,
    enabled: Boolean(numericBatchId && batch),
  })

  const batchTraces = useMemo(
    () => tracePagination.traces.filter((trace) => trace.unit_id === 0),
    [tracePagination.traces]
  )

  const fetchMeta = async (targetId: number) => {
    setLoadingMeta(true)
    try {
      const batchData = await getBatchById(targetId)
      if (!batchData) {
        toast("Batch not found")
        setBatch(null)
        setUnits([])
        return
      }

      const processedUnits = await getProcessedBatchesByBatchId(targetId)
      setBatch(batchData)
      setUnits(processedUnits)
    } catch (error) {
      console.error(error)
      toast("Failed to fetch trace")
    } finally {
      setLoadingMeta(false)
    }
  }

  useEffect(() => {
    if (!numericBatchId) return
    void fetchMeta(numericBatchId)
  }, [numericBatchId])

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      {!paramBatchId && (
        <div className="flex gap-2 rounded-lg border bg-white p-3">
          <input
            type="number"
            placeholder="Enter Batch ID"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="h-10 flex-1 rounded-md border px-3 text-sm"
          />
          <button
            onClick={() => {
              if (!batchId) {
                toast("Enter batch ID")
                return
              }
              void fetchMeta(Number(batchId))
            }}
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white"
          >
            Show Trace
          </button>
        </div>
      )}

      {loadingMeta && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!loadingMeta && batch && (
        <BatchTraceView
          batch={batch}
          traces={batchTraces}
          units={units}
          timelineFooter={
            <InfiniteTraceLoader
              loading={tracePagination.loading}
              hasMore={tracePagination.hasMore}
              error={tracePagination.error}
              sentinelRef={tracePagination.sentinelRef}
            />
          }
        />
      )}

      {!loadingMeta && !batch && <p className="text-sm text-muted-foreground">No trace found.</p>}
    </div>
  )
}
