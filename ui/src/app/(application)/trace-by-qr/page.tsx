"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import {
  getBatchById,
  getProcessedBatchById,
  getProcessedBatchesByBatchId,
  PoultryBatch,
  ProcessedBatch,
} from "@/lib/actions/batch"
import { BatchTraceView, UnitTraceView } from "@/components/trace/trace-views"
import { useInfiniteBatchTrace } from "@/hooks/use-infinite-batch-trace"
import InfiniteTraceLoader from "@/components/trace/infinite-trace-loader"

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

  if (/^\d+:\d+$/.test(trimmed)) return trimmed
  if (/^\d+$/.test(trimmed)) return trimmed

  const batchMatch = trimmed.match(/batch[_-]?id\s*[:=]\s*(\d+)/i)
  if (batchMatch?.[1]) return batchMatch[1]

  const unitMatch = trimmed.match(/unit[_-]?id\s*[:=]\s*(\d+(?::\d+)?)/i)
  if (unitMatch?.[1]) return unitMatch[1]

  const firstUnitLike = trimmed.match(/\d+(?::\d+)?/)
  return firstUnitLike?.[0] ?? null
}

export default function TraceByQrPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [traceId, setTraceId] = useState("")
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState("Camera is off")

  const [mode, setMode] = useState<TraceMode>(null)
  const [batch, setBatch] = useState<PoultryBatch | null>(null)
  const [batchUnits, setBatchUnits] = useState<ProcessedBatch[]>([])
  const [unit, setUnit] = useState<ProcessedBatch | null>(null)

  const currentBatchId = useMemo(() => {
    if (mode === "batch") return batch?.id
    if (mode === "unit") return unit?.original_batch_id
    return undefined
  }, [batch?.id, mode, unit?.original_batch_id])

  const tracePagination = useInfiniteBatchTrace({
    batchId: currentBatchId,
    pageSize: 20,
    enabled: Boolean(currentBatchId),
  })

  const batchTraces = useMemo(
    () => tracePagination.traces.filter((trace) => trace.unit_id === 0 || trace.unit_id === "0"),
    [tracePagination.traces]
  )

  const unitTraces = useMemo(
    () => tracePagination.traces.filter((trace) => String(trace.unit_id) === unit?.unit_id),
    [tracePagination.traces, unit?.unit_id]
  )

  const resetTrace = () => {
    setMode(null)
    setBatch(null)
    setBatchUnits([])
    setUnit(null)
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

    setLoadingMeta(true)
    try {
      const id = targetId.trim()
      const unitData = await getProcessedBatchById(id)
      if (unitData) {
        setMode("unit")
        setUnit(unitData)
        setBatch(null)
        setBatchUnits([])
        return
      }

      if (!/^\d+$/.test(id)) {
        resetTrace()
        toast("No batch or processed unit found for this ID")
        return
      }

      const numericId = Number(id)
      const batchData = await getBatchById(numericId)
      if (batchData) {
        const units = await getProcessedBatchesByBatchId(numericId)

        setMode("batch")
        setBatch(batchData)
        setBatchUnits(units)
        setUnit(null)
        return
      }

      resetTrace()
      toast("No batch or processed unit found for this ID")
    } catch (error) {
      console.error(error)
      toast("Failed to fetch trace")
    } finally {
      setLoadingMeta(false)
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
          setScanMessage("QR found but no valid ID detected")
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
            type="text"
            value={traceId}
            onChange={(e) => setTraceId(e.target.value)}
            placeholder="Enter batch ID or unit ID (e.g. 101 or 101:1)"
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

      {loadingMeta && <p className="text-sm text-muted-foreground">Loading trace...</p>}

      {!loadingMeta && mode === "batch" && batch && (
        <BatchTraceView
          batch={batch}
          traces={batchTraces}
          units={batchUnits}
          timelineFooter={
            <InfiniteTraceLoader
              loading={tracePagination.loading}
              hasMore={tracePagination.hasMore}
              error={tracePagination.error}
              sentinelRef={tracePagination.sentinelRef}
            />
          }
        />
      )}

      {!loadingMeta && mode === "unit" && unit && (
        <UnitTraceView
          unit={unit}
          batchTraces={batchTraces}
          unitTraces={unitTraces}
          batchTimelineFooter={
            <InfiniteTraceLoader
              loading={tracePagination.loading}
              hasMore={tracePagination.hasMore}
              error={tracePagination.error}
              sentinelRef={tracePagination.sentinelRef}
            />
          }
        />
      )}

      {!loadingMeta && !mode && <p className="text-sm text-muted-foreground">No trace selected.</p>}
    </div>
  )
}
