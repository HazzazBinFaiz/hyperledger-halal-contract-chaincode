"use client"

import { useState } from "react"
import BatchMoveTable from "@/components/BatchMoveTable"
import BatchMoveForm from "@/components/BatchMoveForm"
import { PoultryBatch, deliverBatch } from "@/lib/actions/batch"
import { toast } from "sonner"

export default function DeliverPageClient({ batches }: { batches: PoultryBatch[] }) {
    const [selected, setSelected] = useState<number[]>([])

    const handleSubmit = async (data: any) => {
        if (!selected.length) return toast("Select batch")

        for (const batch of selected) {
            await deliverBatch(
                batch,
                data.slaughter_house_id,
                data.delivery_time,
                data.number_of_chicken,
                data.extra_info
            )
        }

        toast(`Batch ${selected.join(",")} delivered to slaughterhouse`)
    }

    return (
        <div className="p-6 space-y-6">
            <BatchMoveForm
                title="Deliver To Slaughterhouse"
                fields={[
                    { name: "slaughter_house_id", label: "Slaughterhouse ID", type: "number" },
                    { name: "delivery_time", label: "Delivery Time", type: "datetime-local" },
                    { name: "number_of_chicken", label: "Number of Chicken", type: "number" },
                    { name: "extra_info", label: "Additional Info" }
                ]}
                onSubmit={handleSubmit}
            />

            <BatchMoveTable batches={batches} selected={selected} onSelect={setSelected} />
        </div>
    )
}
