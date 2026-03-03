"use client"

import { useState } from "react"
import BatchMoveForm from "@/components/BatchMoveForm"
import ProcessedBatchMoveTable from "@/components/ProcessedBatchMoveTable"
import { ProcessedBatch, dispatchProcessedBatchToFrozenTransport } from "@/lib/actions/batch"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function DispatchProcessedPageClient({ units }: { units: ProcessedBatch[] }) {
    const [selected, setSelected] = useState<number[]>([])
    const router = useRouter()

    const handleSubmit = async (data: {
        dispatch_time: string
        room_temperature: number
        extra_info: Record<string, string>
    }) => {
        if (!selected.length) {
            toast("Select processed unit")
            return false
        }

        for (const unitId of selected) {
            await dispatchProcessedBatchToFrozenTransport(
                unitId,
                data.dispatch_time,
                Number(data.room_temperature),
                data.extra_info ?? {}
            )
        }

        toast(`Processed unit ${selected.join(",")} moved to WAITING_FOR_FROZEN_TRANSPORT`)
        setSelected([])
        router.refresh()
        return true
    }

    return (
        <div className="p-6 space-y-6">
            <BatchMoveForm
                title="Dispatch Processed Units To Frozen Transport"
                fields={[
                    { name: "dispatch_time", label: "Dispatch Time", type: "datetime-local" },
                    { name: "room_temperature", label: "Room Temperature", type: "number" },
                    { name: "extra_info", label: "Additional Info", required: false },
                ]}
                onSubmit={handleSubmit}
            />

            <ProcessedBatchMoveTable units={units} selected={selected} onSelect={setSelected} />
        </div>
    )
}
