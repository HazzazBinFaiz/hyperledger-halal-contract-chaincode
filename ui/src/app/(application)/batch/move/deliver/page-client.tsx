"use client"

import { useState } from "react"
import BatchMoveTable from "@/components/BatchMoveTable"
import BatchMoveForm from "@/components/BatchMoveForm"
import { PoultryBatch, deliverBatch } from "@/lib/actions/batch"
import { toast } from "sonner"
import {useRouter} from "next/navigation";
import { SlaughterHouse } from "@/lib/actions/slaughter-house";

export default function DeliverPageClient({ batches, slaughterHouses }: { batches: PoultryBatch[], slaughterHouses: SlaughterHouse[] }) {
    const [selected, setSelected] = useState<number[]>([])
    const router = useRouter()

    const handleSubmit = async (data: {
        slaughter_house_id: string
        delivery_time: string
        number_of_chicken: number
        extra_info: Record<string, string>
    }) => {
        if (!selected.length) {
            toast("Select batch")
            return false
        }

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

        setSelected([])
        router.refresh()
        return true
    }

    return (
        <div className="p-6 space-y-6">
            <BatchMoveForm
                title="Deliver To Slaughterhouse"
                fields={[
                    { name: "slaughter_house_id", label: "Slaughter House", type: "select", options: slaughterHouses.map((house) => ({
                            label: house.name, value: house.id
                        }))
                    },
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
