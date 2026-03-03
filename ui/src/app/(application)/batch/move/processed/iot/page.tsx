import { getProcessedBatchesByStatus } from "@/lib/actions/batch"
import ProcessedBatchIotTracePageClient from "./page-client"

export default async function Page() {
  const units = await getProcessedBatchesByStatus("IN_FROZEN_TRANSPORT")
  return <ProcessedBatchIotTracePageClient units={units} />
}
