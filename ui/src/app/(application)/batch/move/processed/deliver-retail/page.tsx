import { getProcessedBatchesByStatus } from "@/lib/actions/batch"
import DeliverProcessedRetailPageClient from "./page-client"
import { listRetailShop } from "@/lib/actions/retail-shop"

export default async function Page() {
    const [units, retailShops] = await Promise.all([
        getProcessedBatchesByStatus("IN_FROZEN_TRANSPORT"),
        listRetailShop(),
    ])

    return <DeliverProcessedRetailPageClient units={units} retailShops={retailShops} />
}
