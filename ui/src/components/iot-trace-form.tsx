"use client"

import { type FormEvent, useMemo, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import MapCoordinatePicker from "@/components/map-coordinate-picker"
import ExtraInfoEditor from "@/components/extra-info-editor"

type Props = {
  title: string
  onSubmit: (data: {
    longitude: string
    latitude: string
    temperature: string
    extra_info: Record<string, string>
  }) => Promise<void>
}

type ExtraRow = {
  key: string
  value: string
  type?: "text" | "boolean" | "image" | "file"
  boolValue?: boolean
  removable?: boolean
}

export default function IotTraceForm({ title, onSubmit }: Props) {
  const [longitude, setLongitude] = useState("")
  const [latitude, setLatitude] = useState("")
  const [temperature, setTemperature] = useState("")
  const [isPending, startTransition] = useTransition()
  const [extraRows, setExtraRows] = useState<ExtraRow[]>([
    { key: "", value: "", type: "text", boolValue: false, removable: true },
  ])

  const mapCoordinates = useMemo(() => {
    if (!latitude || !longitude) return undefined
    return { latitude: Number(latitude), longitude: Number(longitude) }
  }, [latitude, longitude])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const extra_info = extraRows
      .filter((pair) => pair.key.trim())
      .reduce<Record<string, string>>((acc, pair) => {
        if ((pair.type ?? "text") === "boolean") {
          acc[pair.key.trim()] = pair.boolValue ? "YES" : "NO"
          return acc
        }

        acc[pair.key.trim()] = pair.value
        return acc
      }, {})

    startTransition(() => onSubmit({ longitude, latitude, temperature, extra_info }))
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Longitude</Label>
              <Input type="number" step="any" required value={longitude} onChange={(event) => setLongitude(event.target.value)} />
            </div>
            <div>
              <Label>Latitude</Label>
              <Input type="number" step="any" required value={latitude} onChange={(event) => setLatitude(event.target.value)} />
            </div>
            <div>
              <Label>Temperature (C)</Label>
              <Input type="number" step="any" required value={temperature} onChange={(event) => setTemperature(event.target.value)} />
            </div>
            <div className="flex items-end">
              <MapCoordinatePicker
                value={mapCoordinates}
                onSelect={({ latitude: lat, longitude: lng }) => {
                  setLatitude(lat)
                  setLongitude(lng)
                }}
              />
            </div>
          </div>

          <ExtraInfoEditor rows={extraRows} onChange={setExtraRows} />

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
