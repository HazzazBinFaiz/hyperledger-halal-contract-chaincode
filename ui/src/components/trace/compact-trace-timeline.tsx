import { PoultryBatchTrace } from "@/lib/actions/batch"

type Props = {
  traces: PoultryBatchTrace[]
  focusUnitId?: number
}

function getAccent(action: string) {
  const text = action.toLowerCase()
  if (text.includes("iot")) return "border-cyan-500 bg-cyan-50"
  if (text.includes("dispatch")) return "border-blue-500 bg-blue-50"
  if (text.includes("transport")) return "border-amber-500 bg-amber-50"
  if (text.includes("deliver")) return "border-violet-500 bg-violet-50"
  if (text.includes("slaughter")) return "border-rose-500 bg-rose-50"
  if (text.includes("process")) return "border-emerald-500 bg-emerald-50"
  if (text.includes("sale") || text.includes("sold")) return "border-lime-500 bg-lime-50"
  if (text.includes("reject") || text.includes("recall")) return "border-zinc-500 bg-zinc-100"
  return "border-slate-400 bg-slate-50"
}

export default function CompactTraceTimeline({ traces, focusUnitId }: Props) {
  if (!traces.length) {
    return <p className="text-sm text-muted-foreground">No trace found.</p>
  }

  return (
    <div className="space-y-3">
      {traces.map((trace, index) => {
        const isBatchLevel = trace.unit_id === 0
        const isFocusUnit = typeof focusUnitId === "number" && trace.unit_id === focusUnitId

        return (
          <article
            key={`${trace.datetime}-${trace.action}-${index}`}
            className={`rounded-lg border-l-4 p-3 shadow-sm ${getAccent(trace.action)}`}
          >
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span>{new Date(trace.datetime).toLocaleString()}</span>
              <div className="flex flex-wrap gap-2">
                {isBatchLevel && (
                  <span className="rounded bg-slate-200 px-2 py-0.5 font-medium text-slate-700">
                    Batch Event
                  </span>
                )}
                {isFocusUnit && (
                  <span className="rounded bg-emerald-200 px-2 py-0.5 font-medium text-emerald-800">
                    Unit Event
                  </span>
                )}
                {trace.actor_id !== 0 && (
                  <span className="rounded bg-white/80 px-2 py-0.5 font-medium text-slate-700">
                    Actor {trace.actor_id}
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-900">{trace.action}</p>

            {trace.extra_info && Object.keys(trace.extra_info).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {Object.entries(trace.extra_info).map(([key, value]) => (
                  <span
                    key={`${trace.datetime}-${key}`}
                    className="rounded bg-white px-2 py-1 text-slate-700 shadow-sm"
                  >
                    <span className="font-semibold">{key}:</span> {String(value)}
                  </span>
                ))}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
