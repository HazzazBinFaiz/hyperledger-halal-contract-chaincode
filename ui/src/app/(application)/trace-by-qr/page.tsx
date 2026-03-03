"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import CompactTraceTimeline from "@/components/trace/compact-trace-timeline"
import {
  getProcessedBatchById,
  getTraceOfProcessedBatch,
  PoultryBatchTrace,
  ProcessedBatch,
} from "@/lib/actions/batch"

type BarcodeLike = {
  rawValue?: string
}

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<BarcodeLike[]>
}

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

function parseUnitId(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (/^\d+$/.test(trimmed)) return trimmed

  const unitMatch = trimmed.match(/unit[_-]?id\s*[:=]\s*(\d+)/i)
  if (unitMatch?.[1]) return unitMatch[1]

  const firstNumber = trimmed.match(/\d+/)
  return firstNumber?.[0] ?? null
}

export default function TraceByQrPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [unitId, setUnitId] = useState("")
  const [loading, setLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanMessage, setScanMessage] = useState("Camera is off")
  const [unit, setUnit] = useState<ProcessedBatch | null>(null)
  const [traces, setTraces] = useState<PoultryBatchTrace[]>([])

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

  const fetchTraceByUnitId = async (targetId: string) => {
    if (!targetId) {
      toast("Enter or scan unit ID")
      return
    }

    setLoading(true)
    try {
      const unitData = await getProcessedBatchById(Number(targetId))
      if (!unitData) {
        setUnit(null)
        setTraces([])
        toast("Processed unit not found")
        return
      }

      setUnit(unitData)
      const timeline = await getTraceOfProcessedBatch(Number(targetId))
      setTraces(timeline.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()))
    } catch (error) {
      console.error(error)
      toast("Failed to fetch trace")
    } finally {
      setLoading(false)
    }
  }

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
        const parsed = parseUnitId(raw)
        if (!parsed) {
          setScanMessage("QR found but no unit ID detected")
          return
        }

        setUnitId(parsed)
        setScanMessage(`Scanned unit ID: ${parsed}`)
        stopCamera()
        await fetchTraceByUnitId(parsed)
      } catch {
        // ignore frame-level detection errors
      }
    }, 700)

    return () => clearInterval(timer)
  }, [isScanning])

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
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            placeholder="Enter unit ID"
            className="h-10 min-w-[220px] flex-1 rounded-md border px-3 text-sm"
          />
          <button
            onClick={() => fetchTraceByUnitId(unitId)}
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

      {unit && (
        <section className="rounded-xl border bg-gradient-to-r from-white to-slate-50 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Processed Unit #{unit.unit_id}</h2>
            <span className="rounded bg-cyan-700 px-2 py-1 text-xs font-semibold text-white">{unit.status}</span>
          </div>
          <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-3">
            <div><b>Original Batch:</b> {unit.original_batch_id}</div>
            <div><b>Retail Shop:</b> {unit.retail_shop_id ?? "-"}</div>
            <div><b>Created:</b> {new Date(unit.created_at).toLocaleString()}</div>
            <div><b>Weight:</b> {unit.weight}</div>
          </div>
        </section>
      )}

      {!loading && <CompactTraceTimeline traces={traces} focusUnitId={unit?.unit_id} />}
    </div>
  )
}
