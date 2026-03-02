"use client"

import { useState } from "react"
import BatchMoveTable from "@/components/BatchMoveTable"
import BatchMoveForm from "@/components/BatchMoveForm"
import { PoultryBatch, acceptBatchForTransport } from "@/lib/actions/batch"
import { toast } from "sonner"
import {useRouter} from "next/navigation";

export default function AcceptTransportPageClient({ batches }: { batches: PoultryBatch[] }) {
    const [selected, setSelected] = useState<number[]>([])

    const router = useRouter()

    const handleSubmit = async (data: any) => {
        if (!selected.length) return toast("Select batch")

        for (const batch of selected) {
            await acceptBatchForTransport(
                batch,
                data.acceptance_time,
                data.number_of_chicken,
                data.extra_info
            )
        }

        toast(`Batch ${selected.join(",")} moved to IN_TRANSPORT`)

        router.refresh()
    }

    return (
        <div className="p-6 space-y-6">
            <BatchMoveForm
                title="Accept For Transport"
                fields={[
                    { name: "acceptance_time", label: "Acceptance Time", type: "datetime-local" },
                    { name: "number_of_chicken", label: "Number of Chicken", type: "number" },
                    { name: "extra_info", label: "Additional Info" }
                ]}
                onSubmit={handleSubmit}
            />

            <BatchMoveTable batches={batches} selected={selected} onSelect={setSelected} />
        </div>
    )
}
