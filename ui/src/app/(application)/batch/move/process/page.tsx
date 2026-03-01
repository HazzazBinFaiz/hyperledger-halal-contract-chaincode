import { getAllBatchesByStatus } from "@/lib/actions/batch"
import ProcessPageClient from "./page-client"

export default async function Page() {
    const batches = await getAllBatchesByStatus("SLAUGHTERING")
    return <ProcessPageClient batches={batches} />
}
