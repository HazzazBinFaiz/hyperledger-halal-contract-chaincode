"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  getBatchById,
  getBatchOnlyTrace,
  getProcessedBatchById,
  getProcessedBatchesByBatchId,
  getTraceOfBatch,
  PoultryBatch,
  PoultryBatchTrace,
  ProcessedBatch,
} from "@/lib/actions/batch"
import { BatchTraceView, UnitTraceView } from "@/components/trace/trace-views"

type BarcodeLike = {
  rawValue?: string
}

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<BarcodeLike[]>
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

type TraceMode = "batch" | "unit" | null

function parseId(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (/^\d+$/.test(trimmed)) return trimmed

  const batchMatch = trimmed.match(/batch[_-]?id\s*[:=]\s*(\d+)/i)
  if (batchMatch?.[1]) return batchMatch[1]

  const unitMatch = trimmed.match(/unit[_-]?id\s*[:=]\s*(\d+)/i)
  if (unitMatch?.[1]) return unitMatch[1]

  const firstNumber = trimmed.match(/\d+/)
  return firstNumber?.[0] ?? null
}

export default function TraceByQrPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [traceId, setTraceId] = useState("")
  const [loading, setLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState("Camera is off")

  const [mode, setMode] = useState<TraceMode>(null)
  const [batch, setBatch] = useState<PoultryBatch | null>(null)
  const [batchTraces, setBatchTraces] = useState<PoultryBatchTrace[]>([])
  const [batchUnits, setBatchUnits] = useState<ProcessedBatch[]>([])
  const [unit, setUnit] = useState<ProcessedBatch | null>(null)
  const [unitTraces, setUnitTraces] = useState<PoultryBatchTrace[]>([])

  const resetTrace = () => {
    setMode(null)
    setBatch(null)
    setBatchTraces([])
    setBatchUnits([])
    setUnit(null)
    setUnitTraces([])
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
    setScanMessage("Camera is off")
  }

  const fetchTraceById = useCallback(async (targetId: string) => {
    if (!targetId) {
      toast("Enter or scan batch/unit ID")
      return
    }

    setLoading(true)
    try {
      const id = Number(targetId)
      const batchData = await getBatchById(id)

      if (batchData) {
        const [traces, units] = await Promise.all([
          getBatchOnlyTrace(id),
          getProcessedBatchesByBatchId(id),
        ])

        setMode("batch")
        setBatch(batchData)
        setBatchTraces(traces.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()))
        setBatchUnits(units)
        setUnit(null)
        setUnitTraces([])
        return
      }

      const unitData = await getProcessedBatchById(id)
      if (unitData) {
        const all = await getTraceOfBatch(unitData.original_batch_id)
        const sorted = all.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())

        setMode("unit")
        setUnit(unitData)
        setBatchTraces(sorted.filter((trace) => trace.unit_id === 0))
        setUnitTraces(sorted.filter((trace) => trace.unit_id === unitData.unit_id))
        setBatch(null)
        setBatchUnits([])
        return
      }

      resetTrace()
      toast("No batch or processed unit found for this ID")
    } catch (error) {
      console.error(error)
      toast("Failed to fetch trace")
    } finally {
      setLoading(false)
    }
  }, [])

  const startCamera = async () => {
    const BarcodeDetectorImpl = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector

    if (!BarcodeDetectorImpl) {
      toast("BarcodeDetector is not supported in this browser")
      setScanMessage("BarcodeDetector is not supported")
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })

      streamRef.current = stream

      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      setIsScanning(true)
      setScanMessage("Scanning camera feed...")
    } catch (error) {
      console.error(error)
      toast("Cannot access camera")
      setScanMessage("Cannot access camera")
    }
  }

  useEffect(() => {
    if (!isScanning || !videoRef.current) return

    const BarcodeDetectorImpl = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
    if (!BarcodeDetectorImpl) return

    const detector = new BarcodeDetectorImpl({ formats: ["qr_code"] })
    const timer = setInterval(async () => {
      if (!videoRef.current) return

      try {
        const codes = await detector.detect(videoRef.current)
        if (!codes.length) return

        const raw = codes[0]?.rawValue ?? ""
        const parsed = parseId(raw)
        if (!parsed) {
          setScanMessage("QR found but no numeric ID detected")
          return
        }

        setTraceId(parsed)
        setScanMessage(`Scanned ID: ${parsed}`)
        stopCamera()
        await fetchTraceById(parsed)
      } catch {
        // ignore frame-level detection errors
      }
    }, 700)

    return () => clearInterval(timer)
  }, [fetchTraceById, isScanning])

  useEffect(() => {
    return () => stopCamera()
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h1 className="mb-3 text-lg font-semibold text-slate-900">Trace By QR</h1>

        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            value={traceId}
            onChange={(e) => setTraceId(e.target.value)}
            placeholder="Enter batch or unit ID"
            className="h-10 min-w-[220px] flex-1 rounded-md border px-3 text-sm"
          />
          <button
            onClick={() => fetchTraceById(traceId)}
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white"
          >
            Trace
          </button>
          {!isScanning ? (
            <button
              onClick={startCamera}
              className="h-10 rounded-md bg-cyan-700 px-4 text-sm font-medium text-white"
            >
              Scan Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="h-10 rounded-md bg-slate-600 px-4 text-sm font-medium text-white"
            >
              Stop Camera
            </button>
          )}
        </div>

        <p className="mt-2 text-xs text-slate-600">{scanMessage}</p>

        <div className="mt-3 overflow-hidden rounded-lg border bg-black">
          <video ref={videoRef} className="h-64 w-full object-cover" muted playsInline />
        </div>
      </section>

      {loading && <p className="text-sm text-muted-foreground">Loading trace...</p>}

      {!loading && mode === "batch" && batch && (
        <BatchTraceView batch={batch} traces={batchTraces} units={batchUnits} />
      )}

      {!loading && mode === "unit" && unit && (
        <UnitTraceView unit={unit} batchTraces={batchTraces} unitTraces={unitTraces} />
      )}

      {!loading && !mode && <p className="text-sm text-muted-foreground">No trace selected.</p>}
    </div>
  )
}
