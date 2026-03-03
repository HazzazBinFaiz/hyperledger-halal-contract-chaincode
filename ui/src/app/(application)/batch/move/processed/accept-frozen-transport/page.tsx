import { getProcessedBatchesByStatus } from "@/lib/actions/batch"
import AcceptProcessedFrozenTransportPageClient from "./page-client"

export default async function Page() {
    const units = await getProcessedBatchesByStatus("WAITING_FOR_FROZEN_TRANSPORT")
    return <AcceptProcessedFrozenTransportPageClient units={units} />
}
