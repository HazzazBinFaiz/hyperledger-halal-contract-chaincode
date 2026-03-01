import { getAllBatchesByStatus } from "@/lib/actions/batch"
import DeliverPageClient from "./page-client"

export default async function Page() {
    const batches = await getAllBatchesByStatus("IN_TRANSPORT")
    return <DeliverPageClient batches={batches} />
}
