import { getProcessedBatchesByStatus } from "@/lib/actions/batch"
import DispatchProcessedPageClient from "./page-client"

export default async function Page() {
    const units = await getProcessedBatchesByStatus("CREATED")
    return <DispatchProcessedPageClient units={units} />
}
