"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
    getProcessedBatchById,
    getTraceOfProcessedBatch,
    PoultryBatchTrace,
    ProcessedBatch,
} from "@/lib/actions/batch"

const getStatusColor = (action: string) => {
    if (action.toLowerCase().includes("dispatch")) return "bg-blue-100 text-blue-800"
    if (action.toLowerCase().includes("frozen transport")) return "bg-cyan-100 text-cyan-800"
    if (action.toLowerCase().includes("deliver")) return "bg-purple-100 text-purple-800"
    if (action.toLowerCase().includes("sale")) return "bg-green-100 text-green-800"
    if (action.toLowerCase().includes("sold")) return "bg-emerald-100 text-emerald-800"
    if (action.toLowerCase().includes("rejected") || action.toLowerCase().includes("recall")) return "bg-gray-200 text-gray-700"
    return "bg-gray-50 text-gray-800"
}

export default function ProcessedBatchTracePage() {
    const searchParams = useSearchParams()
    const paramUnitId = searchParams.get("id")
    const [unitId, setUnitId] = useState(paramUnitId || "")
    const [unit, setUnit] = useState<ProcessedBatch | null>(null)
    const [traces, setTraces] = useState<PoultryBatchTrace[]>([])
    const [loading, setLoading] = useState(false)

    const fetchTrace = async (id: string) => {
        if (!id) return toast("Enter processed unit ID")

        setLoading(true)
        try {
            const unitData = await getProcessedBatchById(Number(id))
            if (!unitData) {
                toast("Processed unit not found")
                setUnit(null)
                setTraces([])
                return
            }

            setUnit(unitData)
            const traceData = await getTraceOfProcessedBatch(Number(id))
            setTraces(traceData.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()))
        } catch (error) {
            console.error(error)
            toast("Failed to fetch processed trace")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (paramUnitId) fetchTrace(paramUnitId)
    }, [paramUnitId])

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {!paramUnitId && (
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Enter Processed Unit ID"
                        value={unitId}
                        onChange={(e) => setUnitId(e.target.value)}
                        className="border px-3 py-2 rounded-md flex-1 shadow-sm focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                        onClick={() => fetchTrace(unitId)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 shadow-md"
                    >
                        Show Trace
                    </button>
                </div>
            )}

            {loading && <p className="text-gray-500">Loading...</p>}

            {unit && (
                <div className="border rounded-xl p-6 shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">Processed Unit #{unit.unit_id}</h2>
                    <div className="grid grid-cols-2 gap-3 text-gray-700">
                        <div><b>Original Batch:</b> {unit.original_batch_id}</div>
                        <div><b>Status:</b> {unit.status}</div>
                        <div><b>Created At:</b> {new Date(unit.created_at).toLocaleString()}</div>
                        <div><b>Weight:</b> {unit.weight}</div>
                        <div><b>Retail Shop ID:</b> {unit.retail_shop_id ?? "-"}</div>
                    </div>

                    {unit.extra_info && Object.keys(unit.extra_info).length > 0 && (
                        <div className="bg-white p-4 rounded-lg shadow mt-4 border-l-4 border-blue-500">
                            <h3 className="font-medium text-gray-800 mb-2">Extra Info:</h3>
                            <ul className="space-y-1 text-gray-700">
                                {Object.entries(unit.extra_info).map(([key, value]) => (
                                    <li key={key}><span className="font-semibold">{key}:</span> {value}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {!loading && traces.length > 0 && (
                <ul className="relative border-l-2 border-gray-300 ml-6">
                    {traces.map((trace, index) => (
                        <li key={`${trace.datetime}-${index}`} className="mb-8 ml-6 relative">
                            <span className="absolute -left-5 top-0 w-4 h-4 rounded-full border-2 border-white shadow" />
                            <div className={`p-4 rounded-xl shadow hover:shadow-lg transition ${getStatusColor(trace.action)}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-600">{new Date(trace.datetime).toLocaleString()}</span>
                                    {trace.actor_id !== 0 && (
                                        <span className="text-xs font-semibold bg-gray-200 px-2 py-0.5 rounded">
                                            {`Actor: ${trace.actor_id}`}
                                        </span>
                                    )}
                                </div>
                                <div className="font-semibold text-gray-800 mb-1">{trace.action}</div>
                                {trace.extra_info && Object.keys(trace.extra_info).length > 0 && (
                                    <ul className="text-sm mt-2 space-y-1">
                                        {Object.entries(trace.extra_info).map(([key, value]) => (
                                            <li key={key}><span className="font-semibold">{key}:</span> {String(value)}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {!loading && traces.length === 0 && <p className="text-gray-500 text-center mt-4">No trace found.</p>}
        </div>
    )
}
