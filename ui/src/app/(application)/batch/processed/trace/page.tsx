"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  getProcessedBatchById,
  getTraceOfProcessedBatch,
  PoultryBatchTrace,
  ProcessedBatch,
} from "@/lib/actions/batch"
import CompactTraceTimeline from "@/components/trace/compact-trace-timeline"

export default function ProcessedBatchTracePage() {
  const searchParams = useSearchParams()
  const paramUnitId = searchParams.get("id")
  const [unitId, setUnitId] = useState(paramUnitId || "")
  const [unit, setUnit] = useState<ProcessedBatch | null>(null)
  const [traces, setTraces] = useState<PoultryBatchTrace[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTrace = async (id: string) => {
    if (!id) {
      toast("Enter processed unit ID")
      return
    }

    setLoading(true)
    try {
      const unitData = await getProcessedBatchById(Number(id))
      if (!unitData) {
        toast("Processed unit not found")
        setUnit(null)
        setTraces([])
        return
      }

      setUnit(unitData)
      const traceData = await getTraceOfProcessedBatch(Number(id))
      setTraces(traceData.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()))
    } catch (error) {
      console.error(error)
      toast("Failed to fetch processed trace")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (paramUnitId) {
      fetchTrace(paramUnitId)
    }
  }, [paramUnitId])

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      {!paramUnitId && (
        <div className="flex gap-2 rounded-lg border bg-white p-3">
          <input
            type="number"
            placeholder="Enter Processed Unit ID"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="h-10 flex-1 rounded-md border px-3 text-sm"
          />
          <button
            onClick={() => fetchTrace(unitId)}
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white"
          >
            Show Trace
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {unit && (
        <section className="rounded-xl border bg-gradient-to-r from-white to-slate-50 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Processed Unit #{unit.unit_id}</h2>
            <span className="rounded bg-cyan-700 px-2 py-1 text-xs font-semibold text-white">{unit.status}</span>
          </div>

          <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-3">
            <div><b>Original Batch:</b> {unit.original_batch_id}</div>
            <div><b>Retail Shop:</b> {unit.retail_shop_id ?? "-"}</div>
            <div><b>Created:</b> {new Date(unit.created_at).toLocaleString()}</div>
            <div><b>Weight:</b> {unit.weight}</div>
          </div>

          <p className="mt-3 text-xs text-slate-600">
            Timeline contains both batch-level events and this unit events.
          </p>
        </section>
      )}

      {!loading && <CompactTraceTimeline traces={traces} focusUnitId={unit?.unit_id} />}
    </div>
  )
}
