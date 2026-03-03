import { getAllProcessedBatches } from "@/lib/actions/batch"
import ProcessedBatchesClient from "./ProcessedBatchesClient"

export default async function Page() {
  const units = await getAllProcessedBatches()
  return <ProcessedBatchesClient initialUnits={units} />
}
