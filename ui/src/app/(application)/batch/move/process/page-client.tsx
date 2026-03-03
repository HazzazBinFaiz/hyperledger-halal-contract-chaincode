"use client"

import { useState } from "react"
import BatchMoveTable from "@/components/BatchMoveTable"
import BatchMoveForm from "@/components/BatchMoveForm"
import { PoultryBatch, createProcessedBatch } from "@/lib/actions/batch"
import { toast } from "sonner"
import {useRouter} from "next/navigation";

export default function ProcessPageClient({ batches }: { batches: PoultryBatch[] }) {
    const [selected, setSelected] = useState<number[]>([])
    const router = useRouter()

    const handleSubmit = async (data: {
        number_of_split_batches: number
        extra_info: Record<string, string>
    }) => {
        if (!selected.length) {
            toast("Select batch")
            return false
        }

        for (const batch of selected) {
            await createProcessedBatch(
                batch,
                data.number_of_split_batches,
                data.extra_info
            )
        }

        toast(`Batch ${selected.join(",")} processed`)

        setSelected([])
        router.refresh()
        return true
    }

    return (
        <div className="p-6 space-y-6">
            <BatchMoveForm
                title="Process Batch"
                fields={[
                    { name: "number_of_split_batches", label: "Split Count", type: "number" },
                    { name: "extra_info", label: "Additional Info",
                        extraInfoConfig: {
                            allowImageAdd: true,
                            presets: [
                                {
                                    key: "alive_at_slaughter",
                                    label: "Animal Alive at Slaughter",
                                    type: "boolean",
                                    required: true,
                                    removable: false,
                                },
                                {
                                    key: "healthy_before_slaughter",
                                    label: "Animal Healthy Before Slaughter",
                                    type: "boolean",
                                    required: true,
                                    removable: false,
                                },
                                {
                                    key: "veterinary_checked",
                                    label: "Veterinary Inspection Completed",
                                    type: "boolean",
                                    required: true,
                                    removable: false,
                                },
                                {
                                    key: "no_dead_on_arrival_used",
                                    label: "No Dead-on-Arrival Birds Used",
                                    type: "boolean",
                                    required: true,
                                    removable: false,
                                },
                                {
                                    key: "slaughterman_muslim",
                                    label: "Slaughterman is Muslim",
                                    type: "boolean",
                                    required: true,
                                    removable: false,
                                },
                                {
                                    key: "slaughterman_trained",
                                    label: "Slaughterman Properly Trained",
                                    type: "boolean",
                                    required: true,
                                    removable: false,
                                },
                                {
                                    key: "bismillah_recited",
                                    label: "Bismillah Recited",
                                    type: "boolean",
                                    required: true,
                                    removable: false,
                                },
                                {
                                    key: "recitation_per_bird",
                                    label: "Recitation Per Bird",
                                    type: "boolean",
                                    required: true,
                                    removable: false,
                                },
                                {
                                    key: "intention_confirmed",
                                    label: "Slaughter Intention Confirmed",
                                    type: "boolean",
                                    required: true,
                                    removable: false,
                                },
                                {
                                    key: "knife_sharp",
                                    label: "Knife Sharp and Properly Used",
                                    type: "boolean",
                                    required: true,
                                    removable: false,
                                },
                                {
                                    key: "spinal_cord_not_severed_initially",
                                    label: "Spinal Cord Not Severed Initially",
                                    type: "boolean",
                                    required: true,
                                    removable: false,
                                },
                                {
                                    key: "complete_bleeding_confirmed",
                                    label: "Complete Bleeding Confirmed",
                                    type: "boolean",
                                    required: true,
                                    removable: false,
                                },
                                {
                                    key: "halal_supervisor_name",
                                    label: "Halal Supervisor Name",
                                    type: "string",
                                    required: true,
                                    removable: false,
                                },
                            ],
                        },
                    }
                ]}
                onSubmit={handleSubmit}
            />

            <BatchMoveTable batches={batches} selected={selected} onSelect={setSelected} />
        </div>
    )
}
