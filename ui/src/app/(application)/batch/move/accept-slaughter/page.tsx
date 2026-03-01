import { getAllBatchesByStatus } from "@/lib/actions/batch"
import AcceptSlaughterPageClient from "./page-client"

export default async function Page() {
    const batches = await getAllBatchesByStatus("DELIVERED_TO_SLAUGHTERHOUSE")
    return <AcceptSlaughterPageClient batches={batches} />
}
