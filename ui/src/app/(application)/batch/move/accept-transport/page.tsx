import { getAllBatchesByStatus } from "@/lib/actions/batch"
import AcceptTransportPageClient from "./page-client"

export default async function Page() {
    const batches = await getAllBatchesByStatus("WAITING_FOR_TRANSPORT")
    return <AcceptTransportPageClient batches={batches} />
}
