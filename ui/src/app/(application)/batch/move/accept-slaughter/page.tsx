import { getAllBatchesByStatus } from "@/lib/actions/batch"
import AcceptSlaughterPageClient from "./page-client"
import {listSlaughterHouses} from "@/lib/actions/slaughter-house";

export default async function Page() {
    const batches = await getAllBatchesByStatus("DELIVERED_TO_SLAUGHTERHOUSE")
    const slaughterHouses= await listSlaughterHouses();
    return <AcceptSlaughterPageClient batches={batches} slaughterHouses={slaughterHouses} />
}
