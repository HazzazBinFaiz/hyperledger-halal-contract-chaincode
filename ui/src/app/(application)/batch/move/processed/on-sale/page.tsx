import { getProcessedBatchesByStatus } from "@/lib/actions/batch"
import PutProcessedOnSalePageClient from "./page-client"

export default async function Page() {
    const units = await getProcessedBatchesByStatus("DELIVERED_TO_RETAIL")
    return <PutProcessedOnSalePageClient units={units} />
}
