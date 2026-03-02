import { getAllBatchesByStatus } from "@/lib/actions/batch"
import DeliverPageClient from "./page-client"
import {listSlaughterHouses} from "@/lib/actions/slaughter-house";

export default async function Page() {
    const batches = await getAllBatchesByStatus("IN_TRANSPORT")
    const slaughterHouses = await listSlaughterHouses();
    return <DeliverPageClient batches={batches} slaughterHouses={slaughterHouses} />
}
