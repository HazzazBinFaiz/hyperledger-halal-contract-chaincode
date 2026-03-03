"use client"

import { useEffect, useState } from "react"
import {
  getBatchById,
  getBatchOnlyTrace,
  getProcessedBatchesByBatchId,
  PoultryBatch,
  PoultryBatchTrace,
  ProcessedBatch,
} from "@/lib/actions/batch"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { BatchTraceView } from "@/components/trace/trace-views"

export default function BatchTracePage() {
  const searchParams = useSearchParams()
  const paramBatchId = searchParams.get("id")
  const [batchId, setBatchId] = useState(paramBatchId || "")
  const [traces, setTraces] = useState<PoultryBatchTrace[]>([])
  const [batch, setBatch] = useState<PoultryBatch | null>(null)
  const [units, setUnits] = useState<ProcessedBatch[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTrace = async (id: string) => {
    if (!id) {
      toast("Enter batch ID")
      return
    }

    setLoading(true)
    try {
      const targetId = Number(id)
      const batchData = await getBatchById(targetId)
      if (!batchData) {
        toast("Batch not found")
        setBatch(null)
        setTraces([])
        setUnits([])
        return
      }

      const [batchOnlyTraces, processedUnits] = await Promise.all([
        getBatchOnlyTrace(targetId),
        getProcessedBatchesByBatchId(targetId),
      ])

      setBatch(batchData)
      setUnits(processedUnits)
      setTraces(batchOnlyTraces.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()))
    } catch (error) {
      console.error(error)
      toast("Failed to fetch trace")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (paramBatchId) {
      fetchTrace(paramBatchId)
    }
  }, [paramBatchId])

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
            onClick={() => fetchTrace(batchId)}
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white"
          >
            Show Trace
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!loading && batch && <BatchTraceView batch={batch} traces={traces} units={units} />}

      {!loading && !batch && <p className="text-sm text-muted-foreground">No trace found.</p>}
    </div>
  )
}
