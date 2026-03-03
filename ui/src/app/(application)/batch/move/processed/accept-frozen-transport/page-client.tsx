"use client"

import { useState } from "react"
import BatchMoveForm from "@/components/BatchMoveForm"
import ProcessedBatchMoveTable from "@/components/ProcessedBatchMoveTable"
import { ProcessedBatch, acceptProcessedBatchForFrozenTransport } from "@/lib/actions/batch"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function AcceptProcessedFrozenTransportPageClient({ units }: { units: ProcessedBatch[] }) {
    const [selected, setSelected] = useState<number[]>([])
    const router = useRouter()

    const handleSubmit = async (data: {
        acceptance_time: string
        extra_info: Record<string, string>
    }) => {
        if (!selected.length) {
            toast("Select processed unit")
            return
        }

        for (const unitId of selected) {
            await acceptProcessedBatchForFrozenTransport(unitId, data.acceptance_time, data.extra_info ?? {})
        }

        toast(`Processed unit ${selected.join(",")} moved to IN_FROZEN_TRANSPORT`)
        router.refresh()
    }

    return (
        <div className="p-6 space-y-6">
            <BatchMoveForm
                title="Accept Processed Units For Frozen Transport"
                fields={[
                    { name: "acceptance_time", label: "Acceptance Time", type: "datetime-local" },
                    { name: "extra_info", label: "Additional Info", required: false },
                ]}
                onSubmit={handleSubmit}
            />

            <ProcessedBatchMoveTable units={units} selected={selected} onSelect={setSelected} />
        </div>
    )
}
