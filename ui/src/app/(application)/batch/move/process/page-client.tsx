"use client"

import { useState } from "react"
import BatchMoveTable from "@/components/BatchMoveTable"
import BatchMoveForm from "@/components/BatchMoveForm"
import { PoultryBatch, createProcessedBatch } from "@/lib/actions/batch"
import { toast } from "sonner"

export default function ProcessPageClient({ batches }: { batches: PoultryBatch[] }) {
    const [selected, setSelected] = useState<number[]>([])

    const handleSubmit = async (data: any) => {
        if (!selected.length) return toast("Select batch")

        for (const batch of selected) {
            await createProcessedBatch(
                batch,
                data.number_of_split_batches,
                data.extra_info
            )
        }

        toast(`Batch ${selected.join(",")} processed`)
    }

    return (
        <div className="p-6 space-y-6">
            <BatchMoveForm
                title="Process Batch"
                fields={[
                    { name: "number_of_split_batches", label: "Split Count", type: "number" },
                    { name: "extra_info", label: "Additional Info" }
                ]}
                onSubmit={handleSubmit}
            />

            <BatchMoveTable batches={batches} selected={selected} onSelect={setSelected} />
        </div>
    )
}
