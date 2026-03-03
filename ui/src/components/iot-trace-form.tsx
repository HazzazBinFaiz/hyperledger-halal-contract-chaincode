"use client"

import { type FormEvent, useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import MapCoordinatePicker from "@/components/map-coordinate-picker"

type Props = {
  title: string
  onSubmit: (data: {
    longitude: string
    latitude: string
    temperature: string
    extra_info: Record<string, string>
  }) => Promise<void>
}

export default function IotTraceForm({ title, onSubmit }: Props) {
  const [longitude, setLongitude] = useState("")
  const [latitude, setLatitude] = useState("")
  const [temperature, setTemperature] = useState("")
  const [pairs, setPairs] = useState([{ key: "", value: "" }])
  const [isPending, startTransition] = useTransition()

  const updatePair = (index: number, field: "key" | "value", value: string) => {
    setPairs((prev) => prev.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair)))
  }

  const addPair = () => setPairs((prev) => [...prev, { key: "", value: "" }])

  const removePair = (index: number) => {
    setPairs((prev) => prev.filter((_, i) => i !== index))
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const extra_info = pairs
      .filter((pair) => pair.key.trim())
      .reduce<Record<string, string>>((acc, pair) => {
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
                onSelect={({ latitude: lat, longitude: lng }) => {
                  setLatitude(lat)
                  setLongitude(lng)
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Additional Info</Label>
            {pairs.map((pair, index) => (
              <div key={`pair-${index}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  placeholder="key"
                  value={pair.key}
                  onChange={(event) => updatePair(index, "key", event.target.value)}
                />
                <Input
                  placeholder="value"
                  value={pair.value}
                  onChange={(event) => updatePair(index, "value", event.target.value)}
                />
                <Button type="button" variant="ghost" onClick={() => removePair(index)} disabled={pairs.length === 1}>
                  Remove
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addPair}>Add Info</Button>
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
