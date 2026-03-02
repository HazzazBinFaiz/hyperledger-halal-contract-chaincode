"use client"

import { useState } from "react"
import BatchMoveTable from "@/components/BatchMoveTable"
import BatchMoveForm from "@/components/BatchMoveForm"
import { PoultryBatch, dispatchBatchToTransport } from "@/lib/actions/batch"
import { toast } from "sonner"
import {useRouter} from "next/navigation";

export default function DispatchPageClient({ batches }: { batches: PoultryBatch[] }) {
    const [selected, setSelected] = useState<number[]>([])
    const router = useRouter()

    const handleSubmit = async (data: any) => {
        if (selected.length === 0) return toast("Select batch");
        for (const batch of selected) {
            await dispatchBatchToTransport(batch, data.dispatch_time as string, data.number_of_chicken as string, data.room_temperature as string, data.extra_info);
        }

        toast(`Batch ${selected.join(',')} moved to WAITING_FOR_TRANSPORT`)

        router.refresh()

        return;
    }

    return (
        <div className="p-6 space-y-6">
            <BatchMoveForm
                title="Dispatch To Transport"
                fields={[
                    { name: "dispatch_time", label: "Dispatch Time", type: "datetime-local" },
                    { name: "number_of_chicken", label: "Number of Chicken", type: "number" },
                    { name: "room_temperature", label: "Room Temperature", type: "number" },
                    {
                        name: "extra_info",
                        label: "Additional Info",
                    },
                ]}
                onSubmit={handleSubmit}
            />

            <BatchMoveTable
                batches={batches}
                selected={selected}
                onSelect={setSelected}
            />
        </div>
    )
}
