"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  getProcessedBatchById,
  getTraceOfBatch,
  PoultryBatchTrace,
  ProcessedBatch,
} from "@/lib/actions/batch"
import { UnitTraceView } from "@/components/trace/trace-views"

export default function ProcessedBatchTracePage() {
  const searchParams = useSearchParams()
  const paramUnitId = searchParams.get("id")
  const [unitId, setUnitId] = useState(paramUnitId || "")
  const [unit, setUnit] = useState<ProcessedBatch | null>(null)
  const [batchTraces, setBatchTraces] = useState<PoultryBatchTrace[]>([])
  const [unitTraces, setUnitTraces] = useState<PoultryBatchTrace[]>([])
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
        setBatchTraces([])
        setUnitTraces([])
        return
      }

      const allBatchTraces = await getTraceOfBatch(unitData.original_batch_id)
      const sorted = allBatchTraces.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())

      setUnit(unitData)
      setBatchTraces(sorted.filter((trace) => trace.unit_id === 0))
      setUnitTraces(sorted.filter((trace) => trace.unit_id === unitData.unit_id))
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

      {!loading && unit && (
        <UnitTraceView unit={unit} batchTraces={batchTraces} unitTraces={unitTraces} />
      )}

      {!loading && !unit && <p className="text-sm text-muted-foreground">No trace found.</p>}
    </div>
  )
}
