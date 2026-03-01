import { getAllBatches } from "./action"
import BatchesClient from "./BatchesClient"

export default async function Page() {
  const batches = await getAllBatches()
  return <BatchesClient initialBatches={batches} />
}