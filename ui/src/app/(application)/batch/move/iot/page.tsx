import { getAllBatchesByStatus } from "@/lib/actions/batch"
import BatchIotTracePageClient from "./page-client"

export default async function Page() {
  const batches = await getAllBatchesByStatus("IN_TRANSPORT")
  return <BatchIotTracePageClient batches={batches} />
}
