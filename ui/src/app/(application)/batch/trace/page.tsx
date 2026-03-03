"use client"

import { useEffect, useState } from "react"
import { getBatchById, getTraceOfBatch, PoultryBatch, PoultryBatchTrace } from "@/lib/actions/batch"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import CompactTraceTimeline from "@/components/trace/compact-trace-timeline"

export default function BatchTracePage() {
  const searchParams = useSearchParams()
  const paramBatchId = searchParams.get("id")
  const [batchId, setBatchId] = useState(paramBatchId || "")
  const [traces, setTraces] = useState<PoultryBatchTrace[]>([])
  const [batch, setBatch] = useState<PoultryBatch | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchTrace = async (id: string) => {
    if (!id) {
      toast("Enter batch ID")
      return
    }

    setLoading(true)
    try {
      const batchData = await getBatchById(Number(id))
      if (!batchData) {
        toast("Batch not found")
        setBatch(null)
        setTraces([])
        return
      }
      setBatch(batchData)

      const data = await getTraceOfBatch(Number(id))
      setTraces(data.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()))
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

      {batch && (
        <section className="rounded-xl border bg-gradient-to-r from-white to-slate-50 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Batch #{batch.id}</h2>
            <span className="rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white">{batch.status}</span>
          </div>

          <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-3">
            <div><b>Farm:</b> {batch.farm_id}</div>
            <div><b>Slaughter House:</b> {batch.slaughter_house_id ?? "-"}</div>
            <div><b>Created:</b> {new Date(batch.created_at).toLocaleString()}</div>
            <div><b>Chicken:</b> {batch.number_of_chicken}</div>
            <div><b>Breed:</b> {batch.breed_type}</div>
            <div><b>Ideal Temp:</b> {batch.ideal_temperature}°C</div>
            <div><b>Age:</b> {batch.age_of_chicken}</div>
            <div><b>Processed Units:</b> {batch.number_of_processed_units}</div>
          </div>
        </section>
      )}

      {!loading && <CompactTraceTimeline traces={traces} />}
    </div>
  )
}
