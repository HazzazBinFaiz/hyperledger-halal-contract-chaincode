"use client"

import { useState, useEffect } from "react"
import { getTraceOfBatch, getBatchById, PoultryBatch, PoultryBatchTrace } from "@/lib/actions/batch"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

const getStatusColor = (action: string) => {
    if (action.toLowerCase().includes("dispatch")) return "bg-blue-100 text-blue-800"
    if (action.toLowerCase().includes("transport")) return "bg-yellow-100 text-yellow-800"
    if (action.toLowerCase().includes("deliver")) return "bg-purple-100 text-purple-800"
    if (action.toLowerCase().includes("slaughter")) return "bg-red-100 text-red-800"
    if (action.toLowerCase().includes("processed")) return "bg-green-100 text-green-800"
    if (action.toLowerCase().includes("rejected") || action.toLowerCase().includes("recall")) return "bg-gray-200 text-gray-700"
    return "bg-gray-50 text-gray-800"
}

export default function BatchTracePage() {
    const searchParams = useSearchParams()
    const paramBatchId = searchParams.get("id")
    const [batchId, setBatchId] = useState(paramBatchId || "")
    const [traces, setTraces] = useState<PoultryBatchTrace[]>([])
    const [batch, setBatch] = useState<PoultryBatch | null>(null)
    const [loading, setLoading] = useState(false)

    const fetchTrace = async (id: string) => {
        if (!id) return toast("Enter batch ID")
        setLoading(true)
        try {
            const batchData = await getBatchById(Number(id))
            if (!batchData) return toast("Batch not found")
            setBatch(batchData)

            const data = await getTraceOfBatch(Number(id))
            setTraces(data.sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()))
        } catch (err) {
            console.error(err)
            toast("Failed to fetch trace")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (paramBatchId) fetchTrace(paramBatchId)
    }, [paramBatchId])

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Input if no batch ID in URL */}
            {!paramBatchId && (
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Enter Batch ID"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        className="border px-3 py-2 rounded-md flex-1 shadow-sm focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                        onClick={() => fetchTrace(batchId)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 shadow-md"
                    >
                        Show Trace
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading && <p className="text-gray-500">Loading...</p>}

            {/* Batch Detail Card */}
            {batch && (
                <div className="border rounded-xl p-6 shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">Batch #{batch.id} Details</h2>
                    <div className="grid grid-cols-2 gap-3 text-gray-700">
                        <div><b>Farm ID:</b> {batch.farm_id}</div>
                        <div><b>Slaughterhouse ID:</b> {batch.slaughter_house_id ?? "-"}</div>
                        <div><b>Status:</b> <span className="capitalize">{batch.status}</span></div>
                        <div><b>Created At:</b> {new Date(batch.created_at).toLocaleString()}</div>
                        <div><b>Number of Chicken:</b> {batch.number_of_chicken}</div>
                        <div><b>Age of Chicken:</b> {batch.age_of_chicken}</div>
                        <div><b>Breed Type:</b> {batch.breed_type}</div>
                        <div><b>Ideal Temp:</b> {batch.ideal_temperature}°C</div>
                        <div><b>Processed Units:</b> {batch.number_of_processed_units}</div>
                    </div>

                    {batch.extra_info && Object.keys(batch.extra_info).length > 0 && (
                        <div className="bg-white p-4 rounded-lg shadow mt-4 border-l-4 border-blue-500">
                            <h3 className="font-medium text-gray-800 mb-2">Extra Info:</h3>
                            <ul className="space-y-1 text-gray-700">
                                {Object.entries(batch.extra_info).map(([key, value]) => (
                                    <li key={key}><span className="font-semibold">{key}:</span> {value}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Timeline */}
            {!loading && traces.length > 0 && (
                <ul className="relative border-l-2 border-gray-300 ml-6">
                    {traces.map((t) => (
                        <li key={t.datetime} className="mb-8 ml-6 relative">
                            <span className="absolute -left-5 top-0 w-4 h-4 rounded-full border-2 border-white shadow" />
                            <div className={`p-4 rounded-xl shadow hover:shadow-lg transition ${getStatusColor(t.action)}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-600">{new Date(t.datetime).toLocaleString()}</span>
                                    {t.actor_id !== 0 && <span className="text-xs font-semibold bg-gray-200 px-2 py-0.5 rounded">{`Actor: ${t.actor_id}`}</span>}
                                </div>
                                <div className="font-semibold text-gray-800 mb-1">{t.action}</div>
                                {t.extra_info && Object.keys(t.extra_info).length > 0 && (
                                    <ul className="text-sm mt-2 space-y-1">
                                        {Object.entries(t.extra_info).map(([k,v]) => (
                                            <li key={k}><span className="font-semibold">{k}:</span> {v}</li>
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
