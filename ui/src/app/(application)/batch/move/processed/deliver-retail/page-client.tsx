"use client"

import { useState } from "react"
import BatchMoveForm from "@/components/BatchMoveForm"
import ProcessedBatchMoveTable from "@/components/ProcessedBatchMoveTable"
import { ProcessedBatch, deliverProcessedBatchToRetail } from "@/lib/actions/batch"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { RetailShop } from "@/lib/actions/retail-shop"

export default function DeliverProcessedRetailPageClient({
    units,
    retailShops,
}: {
    units: ProcessedBatch[]
    retailShops: RetailShop[]
}) {
    const [selected, setSelected] = useState<number[]>([])
    const router = useRouter()

    const handleSubmit = async (data: {
        retail_shop_id: number
        delivery_time: string
        extra_info: Record<string, string>
    }) => {
        if (!selected.length) {
            toast("Select processed unit")
            return
        }

        for (const unitId of selected) {
            await deliverProcessedBatchToRetail(
                unitId,
                Number(data.retail_shop_id),
                data.delivery_time,
                data.extra_info ?? {}
            )
        }

        toast(`Processed unit ${selected.join(",")} delivered to retail`)
        router.refresh()
    }

    return (
        <div className="p-6 space-y-6">
            <BatchMoveForm
                title="Deliver Processed Units To Retail Shop"
                fields={[
                    {
                        name: "retail_shop_id",
                        label: "Retail Shop",
                        type: "select",
                        options: retailShops.map((shop) => ({
                            label: shop.name,
                            value: shop.id.toString(),
                        })),
                    },
                    { name: "delivery_time", label: "Delivery Time", type: "datetime-local" },
                    { name: "extra_info", label: "Additional Info", required: false },
                ]}
                onSubmit={handleSubmit}
            />

            <ProcessedBatchMoveTable units={units} selected={selected} onSelect={setSelected} />
        </div>
    )
}
