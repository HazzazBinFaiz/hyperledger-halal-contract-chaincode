"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import ProcessedBatchMoveTable from "@/components/ProcessedBatchMoveTable"
import IotTraceForm from "@/components/iot-trace-form"
import { addIoTTraceForProcessedBatch, ProcessedBatch } from "@/lib/actions/batch"

export default function ProcessedBatchIotTracePageClient({ units }: { units: ProcessedBatch[] }) {
  const [selected, setSelected] = useState<number[]>([])
  const router = useRouter()

  const handleSubmit = async (data: {
    longitude: string
    latitude: string
    temperature: string
    extra_info: Record<string, string>
  }) => {
    if (!selected.length) {
      toast("Select processed unit")
      return false
    }

    for (const unitId of selected) {
      await addIoTTraceForProcessedBatch(
        unitId,
        Number(data.longitude),
        Number(data.latitude),
        Number(data.temperature),
        data.extra_info ?? {}
      )
    }

    toast(`IoT trace added for processed unit ${selected.join(",")}`)
    setSelected([])
    router.refresh()
    return true
  }

  return (
    <div className="space-y-6 p-6">
      <IotTraceForm title="Add Processed Unit IoT Trace" onSubmit={handleSubmit} />
      <ProcessedBatchMoveTable units={units} selected={selected} onSelect={setSelected} />
    </div>
  )
}
