import { PoultryBatchTrace } from "@/lib/actions/batch"
import { Activity, BadgeCheck, Beef, Package, ShoppingBag, Thermometer, Truck } from "lucide-react"
import ExtraInfoView from "@/components/extra-info-view"
import { type ReactNode } from "react"

type Props = {
  traces: PoultryBatchTrace[]
  focusUnitId?: number
}

function getTagIcon(tag?: string) {
  if (tag === "BATCH") return <Package className="h-3.5 w-3.5" />
  if (tag === "TRANSPORT") return <Truck className="h-3.5 w-3.5" />
  if (tag === "SLAUGHTER") return <Beef className="h-3.5 w-3.5" />
  if (tag === "PROCESS") return <Package className="h-3.5 w-3.5" />
  if (tag === "UNIT") return <Package className="h-3.5 w-3.5" />
  if (tag === "IOT") return <Thermometer className="h-3.5 w-3.5" />
  if (tag === "QUALITY") return <BadgeCheck className="h-3.5 w-3.5" />
  if (tag === "SALE") return <ShoppingBag className="h-3.5 w-3.5" />
  return <Activity className="h-3.5 w-3.5" />
}

function renderHumanMessage(message: string) {
  const isoRegex = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\b/g
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null = isoRegex.exec(message)

  while (match) {
    const rawIso = match[0]
    const start = match.index

    if (start > lastIndex) {
      parts.push(message.slice(lastIndex, start))
    }

    const friendly = new Date(rawIso).toLocaleString()
    parts.push(
      <span key={`${rawIso}-${start}`} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700">
        {friendly}
      </span>
    )

    lastIndex = start + rawIso.length
    match = isoRegex.exec(message)
  }

  if (lastIndex < message.length) {
    parts.push(message.slice(lastIndex))
  }

  return parts.length ? parts : message
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
          <article key={`${trace.datetime}-${trace.action}-${index}`} className="rounded-lg border border-slate-200 p-3 shadow-sm">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {new Date(trace.datetime).toLocaleString()}
              </span>

              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-medium text-slate-700 shadow-sm">
                  {getTagIcon(trace.action_tag)}
                  {trace.action_tag || "GENERAL"}
                </span>
                {isBatchLevel && <span className="rounded bg-slate-200 px-2 py-0.5 font-medium">Batch Event</span>}
                {isFocusUnit && <span className="rounded bg-emerald-200 px-2 py-0.5 font-medium text-emerald-800">Unit Event</span>}
                {trace.actor_id !== 0 && <span className="rounded bg-slate-100 px-2 py-0.5 font-medium">Actor {trace.actor_id}</span>}
              </div>
            </div>

            <p className="text-sm text-slate-900">{renderHumanMessage(trace.action_message || trace.action)}</p>
            {trace.action_code && <p className="mt-0.5 text-xs text-slate-500">{trace.action_code}</p>}

            {trace.extra_info && Object.keys(trace.extra_info).length > 0 && (
              <div className="mt-2 rounded bg-white/70 p-2 text-xs">
                <ExtraInfoView info={trace.extra_info} compactThreshold={3} />
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
