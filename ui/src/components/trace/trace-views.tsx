import Link from "next/link"
import { type ReactNode } from "react"
import CompactTraceTimeline from "@/components/trace/compact-trace-timeline"
import { PoultryBatch, PoultryBatchTrace, ProcessedBatch } from "@/lib/actions/batch"

type BatchTraceViewProps = {
  batch: PoultryBatch
  traces: PoultryBatchTrace[]
  units?: ProcessedBatch[]
  timelineFooter?: ReactNode
}

export function BatchTraceView({ batch, traces, units = [], timelineFooter }: BatchTraceViewProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-gradient-to-r from-white to-slate-50 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Batch #{batch.id}</h2>
          <span className="rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white">{batch.status}</span>
        </div>

        <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-3">
          <div><b>Farm:</b> {batch.farm_id}</div>
          <div><b>Slaughter House:</b> {batch.slaughter_house_id ?? "-"}</div>
          <div><b>Created:</b> {new Date(batch.created_at).toLocaleString()}</div>
          <div><b>Chicken:</b> {batch.number_of_chicken}</div>
          <div><b>Breed:</b> {batch.breed_type}</div>
          <div><b>Ideal Temp:</b> {batch.ideal_temperature}°C</div>
          <div><b>Age:</b> {batch.age_of_chicken}</div>
          <div><b>Processed Units:</b> {batch.number_of_processed_units}</div>
        </div>
      </section>

      <section className="space-y-2 rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Batch Timeline</h3>
        <CompactTraceTimeline traces={traces} />
        {timelineFooter}
      </section>

      {units.length > 0 && (
        <section className="space-y-2 rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Processed Units From This Batch</h3>
          <div className="flex flex-wrap gap-2">
            {units.map((unit) => (
              <Link
                key={unit.unit_id}
                href={`/batch/processed/trace?id=${unit.unit_id}`}
                className="rounded-md border bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Unit {unit.unit_id}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

type UnitTraceViewProps = {
  unit: ProcessedBatch
  batchTraces: PoultryBatchTrace[]
  unitTraces: PoultryBatchTrace[]
  batchTimelineFooter?: ReactNode
  unitTimelineFooter?: ReactNode
}

export function UnitTraceView({ unit, batchTraces, unitTraces, batchTimelineFooter, unitTimelineFooter }: UnitTraceViewProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-gradient-to-r from-white to-slate-50 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Processed Unit #{unit.unit_id}</h2>
          <span className="rounded bg-cyan-700 px-2 py-1 text-xs font-semibold text-white">{unit.status}</span>
        </div>

        <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-3">
          <div>
            <b>Original Batch:</b>{" "}
            <Link href={`/batch/trace?id=${unit.original_batch_id}`} className="underline-offset-4 hover:underline">
              {unit.original_batch_id}
            </Link>
          </div>
          <div><b>Retail Shop:</b> {unit.retail_shop_id ?? "-"}</div>
          <div><b>Created:</b> {new Date(unit.created_at).toLocaleString()}</div>
          <div><b>Weight:</b> {unit.weight}</div>
        </div>
      </section>

      <section className="space-y-2 rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Batch Timeline (Parent Batch)</h3>
        <CompactTraceTimeline traces={batchTraces} />
        {batchTimelineFooter}
      </section>

      <section className="space-y-2 rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Unit Timeline</h3>
        <CompactTraceTimeline traces={unitTraces} focusUnitId={unit.unit_id} />
        {unitTimelineFooter}
      </section>
    </div>
  )
}
