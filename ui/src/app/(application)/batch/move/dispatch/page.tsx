import {getAllBatches, getAllBatchesByStatus} from "@/lib/actions/batch"
import DispatchPageClient from "./page-client"

export default async function Page() {
    const batches = await getAllBatchesByStatus("CREATED")

    return <DispatchPageClient batches={batches} />
}
