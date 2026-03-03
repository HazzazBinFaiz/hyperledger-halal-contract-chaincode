"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import BatchMoveTable from "@/components/BatchMoveTable"
import IotTraceForm from "@/components/iot-trace-form"
import { addIoTTraceForBatch, PoultryBatch } from "@/lib/actions/batch"

export default function BatchIotTracePageClient({ batches }: { batches: PoultryBatch[] }) {
  const [selected, setSelected] = useState<number[]>([])
  const router = useRouter()

  const handleSubmit = async (data: {
    longitude: string
    latitude: string
    temperature: string
    extra_info: Record<string, string>
  }) => {
    if (!selected.length) {
      toast("Select batch")
      return
    }

    for (const batchId of selected) {
      await addIoTTraceForBatch(
        batchId,
        Number(data.longitude),
        Number(data.latitude),
        Number(data.temperature),
        data.extra_info ?? {}
      )
    }

    toast(`IoT trace added for batch ${selected.join(",")}`)
    router.refresh()
  }

  return (
    <div className="space-y-6 p-6">
      <IotTraceForm title="Add Batch IoT Trace" onSubmit={handleSubmit} />
      <BatchMoveTable batches={batches} selected={selected} onSelect={setSelected} />
    </div>
  )
}
