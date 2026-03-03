"use client"

import { useState } from "react"
import BatchMoveTable from "@/components/BatchMoveTable"
import BatchMoveForm from "@/components/BatchMoveForm"
import { PoultryBatch, acceptBatchForSlaughtering } from "@/lib/actions/batch"
import { toast } from "sonner"
import {useRouter} from "next/navigation";
import {SlaughterHouse} from "@/lib/actions/slaughter-house";

export default function AcceptSlaughterPageClient({ batches, slaughterHouses }: { batches: PoultryBatch[], slaughterHouses: SlaughterHouse[] }) {
    const [selected, setSelected] = useState<number[]>([])
    const router = useRouter()

    const handleSubmit = async (data: {
        slaughter_house_id: string
        acceptance_time: string
        number_of_chicken: number
        extra_info: Record<string, string>
    }) => {
        if (!selected.length) {
            toast("Select batch")
            return false
        }

        for (const batch of selected) {
            await acceptBatchForSlaughtering(
                batch,
                data.slaughter_house_id,
                data.acceptance_time,
                data.number_of_chicken,
                data.extra_info
            )
        }

        toast(`Batch ${selected.join(",")} moved to SLAUGHTERING`)

        setSelected([])
        router.refresh()
        return true
    }

    return (
        <div className="p-6 space-y-6">
            <BatchMoveForm
                title="Accept For Slaughtering"
                fields={[
                    { name: "slaughter_house_id", label: "Slaughter House", type: "select", options: slaughterHouses.map((house) => ({
                            label: house.name, value: house.id.toString()
                        }))
                    },
                    { name: "acceptance_time", label: "Acceptance Time", type: "datetime-local" },
                    { name: "number_of_chicken", label: "Number of Chicken", type: "number" },
                    {
                        name: "extra_info",
                        label: "Additional Info",
                        extraInfoConfig: {
                            allowImageAdd: true,
                        },
                    }
                ]}
                onSubmit={handleSubmit}
            />

            <BatchMoveTable batches={batches} selected={selected} onSelect={setSelected} />
        </div>
    )
}
