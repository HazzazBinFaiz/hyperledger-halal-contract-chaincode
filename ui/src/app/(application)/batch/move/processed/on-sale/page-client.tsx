"use client"

import { useState } from "react"
import BatchMoveForm from "@/components/BatchMoveForm"
import ProcessedBatchMoveTable from "@/components/ProcessedBatchMoveTable"
import { ProcessedBatch, putProcessedBatchOnSale } from "@/lib/actions/batch"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function PutProcessedOnSalePageClient({ units }: { units: ProcessedBatch[] }) {
    const [selected, setSelected] = useState<string[]>([])
    const router = useRouter()

    const handleSubmit = async (data: {
        sale_time: string
        extra_info: Record<string, string>
    }) => {
        if (!selected.length) {
            toast("Select processed unit")
            return false
        }

        for (const unitId of selected) {
            await putProcessedBatchOnSale(unitId, data.sale_time, data.extra_info ?? {})
        }

        toast(`Processed unit ${selected.join(",")} moved to ON_SALE`)
        setSelected([])
        router.refresh()
        return true
    }

    return (
        <div className="p-6 space-y-6">
            <BatchMoveForm
                title="Put Processed Units On Sale"
                fields={[
                    { name: "sale_time", label: "Sale Time", type: "datetime-local" },
                    { name: "extra_info", label: "Additional Info", required: false },
                ]}
                onSubmit={handleSubmit}
            />

            <ProcessedBatchMoveTable units={units} selected={selected} onSelect={setSelected} />
        </div>
    )
}
