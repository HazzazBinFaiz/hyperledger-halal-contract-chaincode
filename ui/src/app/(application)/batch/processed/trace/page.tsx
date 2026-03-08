"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { getIoTLogsForUnit, getProcessedBatchById, IoTTraceLog, PoultryBatchTrace, ProcessedBatch } from "@/lib/actions/batch"
import { UnitTraceView } from "@/components/trace/trace-views"
import { useInfiniteBatchTrace } from "@/hooks/use-infinite-batch-trace"
import InfiniteTraceLoader from "@/components/trace/infinite-trace-loader"

export default function ProcessedBatchTracePage() {
  const searchParams = useSearchParams()
  const paramUnitId = searchParams.get("id")
  const [unitId, setUnitId] = useState(paramUnitId || "")
  const [unit, setUnit] = useState<ProcessedBatch | null>(null)
  const [iotLogs, setIotLogs] = useState<IoTTraceLog[]>([])
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
    () => tracePagination.traces.filter((trace) => (trace.unit_id === 0 || trace.unit_id === "0") && trace.action_tag !== "IOT"),
    [tracePagination.traces]
  )

  const unitTraces = useMemo(() => {
    const nonIotChainTraces = tracePagination.traces.filter(
      (trace) => String(trace.unit_id) === unit?.unit_id && trace.action_tag !== "IOT"
    )

    const iotAsTraces: PoultryBatchTrace[] = iotLogs.map((log) => ({
      batch_id: log.batch_id,
      unit_id: log.unit_id ?? unit?.unit_id ?? "0",
      datetime: log.created_at,
      actor_id: 0,
      action_code: "UNIT_IOT_OFFCHAIN_LOGGED",
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
  }, [iotLogs, tracePagination.traces, unit?.unit_id])

  const fetchMeta = async (id: string) => {
    setLoadingMeta(true)
    try {
      const unitData = await getProcessedBatchById(id)
      if (!unitData) {
        toast("Processed unit not found")
        setUnit(null)
        setIotLogs([])
        return
      }

      const timescaleIotLogs = await getIoTLogsForUnit(id)
      setUnit(unitData)
      setIotLogs(timescaleIotLogs)
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
