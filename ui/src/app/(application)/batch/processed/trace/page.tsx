"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { getProcessedBatchById, ProcessedBatch } from "@/lib/actions/batch"
import { UnitTraceView } from "@/components/trace/trace-views"
import { useInfiniteBatchTrace } from "@/hooks/use-infinite-batch-trace"
import InfiniteTraceLoader from "@/components/trace/infinite-trace-loader"

export default function ProcessedBatchTracePage() {
  const searchParams = useSearchParams()
  const paramUnitId = searchParams.get("id")
  const [unitId, setUnitId] = useState(paramUnitId || "")
  const [unit, setUnit] = useState<ProcessedBatch | null>(null)
  const [loadingMeta, setLoadingMeta] = useState(false)

  const targetUnitId = useMemo(() => {
    const value = (unitId || paramUnitId || "").trim()
    return value ? value : undefined
  }, [paramUnitId, unitId])

  const tracePagination = useInfiniteBatchTrace({
    batchId: unit?.original_batch_id,
    pageSize: 20,
    enabled: Boolean(unit),
  })

  const batchTraces = useMemo(
    () => tracePagination.traces.filter((trace) => trace.unit_id === 0 || trace.unit_id === "0"),
    [tracePagination.traces]
  )

  const unitTraces = useMemo(
    () => tracePagination.traces.filter((trace) => String(trace.unit_id) === unit?.unit_id),
    [tracePagination.traces, unit?.unit_id]
  )

  const fetchMeta = async (id: string) => {
    setLoadingMeta(true)
    try {
      const unitData = await getProcessedBatchById(id)
      if (!unitData) {
        toast("Processed unit not found")
        setUnit(null)
        return
      }

      setUnit(unitData)
    } catch (error) {
      console.error(error)
      toast("Failed to fetch processed trace")
    } finally {
      setLoadingMeta(false)
    }
  }

  useEffect(() => {
    if (!targetUnitId) return
    void fetchMeta(targetUnitId)
  }, [targetUnitId])

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      {!paramUnitId && (
        <div className="flex gap-2 rounded-lg border bg-white p-3">
          <input
            type="text"
            placeholder="Enter Processed Unit ID"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="h-10 flex-1 rounded-md border px-3 text-sm"
          />
          <button
            onClick={() => {
              if (!unitId) {
                toast("Enter processed unit ID")
                return
              }
              void fetchMeta(unitId)
            }}
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white"
          >
            Show Trace
          </button>
        </div>
      )}

      {loadingMeta && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!loadingMeta && unit && (
        <UnitTraceView
          unit={unit}
          batchTraces={batchTraces}
          unitTraces={unitTraces}
          batchTimelineFooter={
            <InfiniteTraceLoader
              loading={tracePagination.loading}
              hasMore={tracePagination.hasMore}
              error={tracePagination.error}
              sentinelRef={tracePagination.sentinelRef}
            />
          }
        />
      )}

      {!loadingMeta && !unit && <p className="text-sm text-muted-foreground">No trace found.</p>}
    </div>
  )
}
