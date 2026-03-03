"use client"

import { useState } from "react"
import BatchMoveForm from "@/components/BatchMoveForm"
import ProcessedBatchMoveTable from "@/components/ProcessedBatchMoveTable"
import { ProcessedBatch, sellProcessedBatch } from "@/lib/actions/batch"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SellProcessedPageClient({ units }: { units: ProcessedBatch[] }) {
    const [selected, setSelected] = useState<number[]>([])
    const router = useRouter()

    const handleSubmit = async (data: {
        sold_time: string
        extra_info: Record<string, string>
    }) => {
        if (!selected.length) {
            toast("Select processed unit")
            return false
        }

        for (const unitId of selected) {
            await sellProcessedBatch(unitId, data.sold_time, data.extra_info ?? {})
        }

        toast(`Processed unit ${selected.join(",")} moved to SOLD`)
        setSelected([])
        router.refresh()
        return true
    }

    return (
        <div className="p-6 space-y-6">
            <BatchMoveForm
                title="Mark Processed Units As Sold"
                fields={[
                    { name: "sold_time", label: "Sold Time", type: "datetime-local" },
                    { name: "extra_info", label: "Additional Info", required: false },
                ]}
                onSubmit={handleSubmit}
            />

            <ProcessedBatchMoveTable units={units} selected={selected} onSelect={setSelected} />
        </div>
    )
}
