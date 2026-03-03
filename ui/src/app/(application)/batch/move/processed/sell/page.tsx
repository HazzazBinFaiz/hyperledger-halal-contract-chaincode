import { getProcessedBatchesByStatus } from "@/lib/actions/batch"
import SellProcessedPageClient from "./page-client"

export default async function Page() {
    const units = await getProcessedBatchesByStatus("ON_SALE")
    return <SellProcessedPageClient units={units} />
}
