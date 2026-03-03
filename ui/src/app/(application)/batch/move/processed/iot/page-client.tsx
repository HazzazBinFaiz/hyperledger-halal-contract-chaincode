"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import BatchMoveForm from "@/components/BatchMoveForm"
import ProcessedBatchMoveTable from "@/components/ProcessedBatchMoveTable"
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
      return
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
    router.refresh()
  }

  return (
    <div className="space-y-6 p-6">
      <BatchMoveForm
        title="Add Processed Unit IoT Trace"
        fields={[
          { name: "longitude", label: "Longitude", type: "number" },
          { name: "latitude", label: "Latitude", type: "number" },
          { name: "temperature", label: "Temperature (°C)", type: "number" },
          { name: "extra_info", label: "Additional Info", required: false },
        ]}
        onSubmit={handleSubmit}
      />

      <ProcessedBatchMoveTable units={units} selected={selected} onSelect={setSelected} />
    </div>
  )
}
