"use client"

import { useEffect, useMemo, useState } from "react"
import {
  getIoTLogsForBatch,
  getBatchById,
  getProcessedBatchesByBatchId,
  IoTTraceLog,
  PoultryBatch,
  PoultryBatchTrace,
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
  const [iotLogs, setIotLogs] = useState<IoTTraceLog[]>([])
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

  const batchTraces = useMemo(() => {
    const nonIotChainTraces = tracePagination.traces.filter(
      (trace) => (trace.unit_id === 0 || trace.unit_id === "0") && trace.action_tag !== "IOT"
    )

    const iotAsTraces: PoultryBatchTrace[] = iotLogs
      .filter((log) => !log.unit_id)
      .map((log) => ({
        batch_id: log.batch_id,
        unit_id: 0,
        datetime: log.created_at,
        actor_id: 0,
        action_code: "BATCH_IOT_OFFCHAIN_LOGGED",
        action: "IoT telemetry stored in TimescaleDB",
        action_message: "IoT telemetry stored in TimescaleDB",
        action_tag: "IOT",
        extra_info: {
          longitude: log.longitude,
          latitude: log.latitude,
          temperature: log.temperature,
          payload_hash: log.payload_hash,
          storage: "timescaledb",
          ...log.extra_info,
        },
      }))

    return [...nonIotChainTraces, ...iotAsTraces].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    )
  }, [iotLogs, tracePagination.traces])

  const fetchMeta = async (targetId: number) => {
    setLoadingMeta(true)
    try {
      const batchData = await getBatchById(targetId)
      if (!batchData) {
        toast("Batch not found")
        setBatch(null)
        setUnits([])
        setIotLogs([])
        return
      }

      const processedUnits = await getProcessedBatchesByBatchId(targetId)
      const timescaleIotLogs = await getIoTLogsForBatch(targetId)
      setBatch(batchData)
      setUnits(processedUnits)
      setIotLogs(timescaleIotLogs)
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
