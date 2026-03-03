"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type SearchResult = {
  display_name: string
  lat: string
  lon: string
}

type Coordinates = {
  latitude: number
  longitude: number
}

type Props = {
  value?: Coordinates
  onSelect: (coordinates: { latitude: string; longitude: string }) => void
}

type LeafletObject = {
  setView: (coords: [number, number], zoom?: number) => LeafletObject
  on: (event: string, handler: (event: { latlng: { lat: number; lng: number } }) => void) => LeafletObject
  off: (event: string) => LeafletObject
  remove: () => void
  addTo: (target: LeafletObject) => LeafletObject
  setLatLng: (coords: [number, number]) => LeafletObject
  getLatLng: () => { lat: number; lng: number }
  bindPopup: (text: string) => LeafletObject
  openPopup: () => LeafletObject
}

type LeafletApi = {
  map: (container: HTMLElement) => LeafletObject
  tileLayer: (url: string, options: Record<string, string | number>) => LeafletObject
  marker: (coords: [number, number], options?: Record<string, boolean>) => LeafletObject
}

declare global {
  interface Window {
    L?: LeafletApi
  }
}

async function ensureLeafletLoaded() {
  if (window.L) return window.L

  const cssId = "leaflet-css"
  if (!document.getElementById(cssId)) {
    const link = document.createElement("link")
    link.id = cssId
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(link)
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("leaflet-js") as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Failed to load leaflet")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.id = "leaflet-js"
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load leaflet"))
    document.body.appendChild(script)
  })

  if (!window.L) {
    throw new Error("Leaflet not available")
  }

  return window.L
}

export default function MapCoordinatePicker({ value, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Coordinates | null>(value ?? null)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletObject | null>(null)
  const markerRef = useRef<LeafletObject | null>(null)

  const upsertMarker = (coords: Coordinates) => {
    if (!window.L || !mapRef.current) return

    if (!markerRef.current) {
      markerRef.current = window.L.marker([coords.latitude, coords.longitude], { draggable: true }).addTo(mapRef.current)
      markerRef.current.on("dragend", () => {
        if (!markerRef.current) return
        const latLng = markerRef.current.getLatLng()
        setSelected({ latitude: latLng.lat, longitude: latLng.lng })
      })
      return
    }

    markerRef.current.setLatLng([coords.latitude, coords.longitude])
  }

  useEffect(() => {
    if (!open || !mapContainerRef.current) return

    let cancelled = false

    const init = async () => {
      try {
        const L = await ensureLeafletLoaded()
        if (cancelled || !mapContainerRef.current) return

        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
          markerRef.current = null
        }

        const initial = value ?? { latitude: 23.8103, longitude: 90.4125 }
        const map = L.map(mapContainerRef.current).setView([initial.latitude, initial.longitude], 12)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map)

        map.on("click", (event) => {
          const coords = { latitude: event.latlng.lat, longitude: event.latlng.lng }
          setSelected(coords)
          upsertMarker(coords)
        })

        mapRef.current = map
        upsertMarker(initial)
      } catch (error) {
        console.error(error)
      }
    }

    init()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [open, value])

  const search = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`
      const response = await fetch(url)
      const data = (await response.json()) as SearchResult[]
      setResults(data)
    } catch (error) {
      console.error(error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const pickByAddress = (item: SearchResult) => {
    const coords = { latitude: Number(item.lat), longitude: Number(item.lon) }
    setSelected(coords)
    upsertMarker(coords)
    mapRef.current?.setView([coords.latitude, coords.longitude], 15)
  }

  const useCurrentLocation = async () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition((position) => {
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
      setSelected(coords)
      upsertMarker(coords)
      mapRef.current?.setView([coords.latitude, coords.longitude], 15)
    })
  }

  const applySelection = () => {
    if (!selected) return
    onSelect({
      latitude: selected.latitude.toFixed(6),
      longitude: selected.longitude.toFixed(6),
    })
    setOpen(false)
  }

  const setLatByHand = (lat: string) => {
    const latNum = Number(lat)
    if (!Number.isFinite(latNum)) return
    const next = { latitude: latNum, longitude: selected?.longitude ?? 90.4125 }
    setSelected(next)
    upsertMarker(next)
  }

  const setLngByHand = (lng: string) => {
    const lngNum = Number(lng)
    if (!Number.isFinite(lngNum)) return
    const next = { latitude: selected?.latitude ?? 23.8103, longitude: lngNum }
    setSelected(next)
    upsertMarker(next)
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Pick From Map
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-xl border bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Pick Coordinates</h3>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <div className="mb-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
              <div>
                <Label>Search Address</Label>
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search address" />
              </div>
              <Button type="button" className="mt-6" onClick={search} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
              <Button type="button" className="mt-6" variant="secondary" onClick={useCurrentLocation}>
                Use My Location
              </Button>
            </div>

            <div className="mb-3 max-h-36 space-y-2 overflow-auto">
              {results.map((item) => (
                <button
                  key={`${item.lat}-${item.lon}-${item.display_name}`}
                  type="button"
                  onClick={() => pickByAddress(item)}
                  className="w-full rounded-md border px-3 py-2 text-left text-xs hover:bg-slate-50"
                >
                  <div className="font-medium text-slate-900">{item.display_name}</div>
                  <div className="text-slate-600">
                    lat: {item.lat}, lng: {item.lon}
                  </div>
                </button>
              ))}
            </div>

            <div ref={mapContainerRef} className="h-72 w-full rounded-md border" />

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <div>
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={selected?.latitude ?? ""}
                  onChange={(event) => setLatByHand(event.target.value)}
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={selected?.longitude ?? ""}
                  onChange={(event) => setLngByHand(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button type="button" onClick={applySelection} disabled={!selected}>
                Use Coordinates
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
