"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type SearchResult = {
  display_name: string
  lat: string
  lon: string
}

type Props = {
  onSelect: (coordinates: { latitude: string; longitude: string }) => void
}

function buildMapSrc(latitude: number, longitude: number) {
  const delta = 0.01
  const left = longitude - delta
  const right = longitude + delta
  const top = latitude + delta
  const bottom = latitude - delta

  const bbox = `${left}%2C${bottom}%2C${right}%2C${top}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`
}

export default function MapCoordinatePicker({ onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<{ latitude: number; longitude: number } | null>(null)

  const mapSrc = useMemo(() => {
    if (!selected) return ""
    return buildMapSrc(selected.latitude, selected.longitude)
  }, [selected])

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

  const useCurrentLocation = async () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition((position) => {
      setSelected({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      })
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

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Pick From Map
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-xl border bg-white p-4 shadow-xl">
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
                  onClick={() => setSelected({ latitude: Number(item.lat), longitude: Number(item.lon) })}
                  className="w-full rounded-md border px-3 py-2 text-left text-xs hover:bg-slate-50"
                >
                  <div className="font-medium text-slate-900">{item.display_name}</div>
                  <div className="text-slate-600">
                    lat: {item.lat}, lng: {item.lon}
                  </div>
                </button>
              ))}
            </div>

            {selected && (
              <div className="space-y-2">
                <p className="text-xs text-slate-700">
                  Selected: lat {selected.latitude.toFixed(6)}, lng {selected.longitude.toFixed(6)}
                </p>
                <iframe title="OpenStreetMap" src={mapSrc} className="h-64 w-full rounded-md border" />
              </div>
            )}

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
