"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { defaultStorageConfig, StorageConfig } from "@/lib/storage-config"

export default function StorageSettingsPage() {
  const [config, setConfig] = useState<StorageConfig>(defaultStorageConfig)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/storage/config", { cache: "no-store" })
        if (!response.ok) throw new Error("failed")
        const serverConfig = (await response.json()) as StorageConfig
        setConfig({ ...defaultStorageConfig, ...serverConfig })
      } catch {
        setConfig(defaultStorageConfig)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const save = async () => {
    const response = await fetch("/api/storage/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    })

    if (!response.ok) return

    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-600">Loading storage config...</div>
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Storage Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <select
              value={config.provider}
              onChange={(event) =>
                setConfig((prev) => ({ ...prev, provider: event.target.value as StorageConfig["provider"] }))
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="local">Local Filesystem</option>
              <option value="s3">S3</option>
              <option value="minio">MinIO</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Local Base Path</Label>
            <Input
              value={config.localBasePath}
              onChange={(event) => setConfig((prev) => ({ ...prev, localBasePath: event.target.value }))}
              placeholder="/uploads"
            />
          </div>

          {(config.provider === "s3" || config.provider === "minio") && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bucket</Label>
                  <Input
                    value={config.bucket ?? ""}
                    onChange={(event) => setConfig((prev) => ({ ...prev, bucket: event.target.value }))}
                    placeholder="bucket-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input
                    value={config.region ?? ""}
                    onChange={(event) => setConfig((prev) => ({ ...prev, region: event.target.value }))}
                    placeholder="us-east-1"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Endpoint</Label>
                  <Input
                    value={config.endpoint ?? ""}
                    onChange={(event) => setConfig((prev) => ({ ...prev, endpoint: event.target.value }))}
                    placeholder="https://s3.amazonaws.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Public Base URL (optional)</Label>
                  <Input
                    value={config.publicBaseUrl ?? ""}
                    onChange={(event) => setConfig((prev) => ({ ...prev, publicBaseUrl: event.target.value }))}
                    placeholder="https://cdn.example.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Access Key ID</Label>
                  <Input
                    value={config.accessKeyId ?? ""}
                    onChange={(event) => setConfig((prev) => ({ ...prev, accessKeyId: event.target.value }))}
                    placeholder="AKIA..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secret Access Key</Label>
                  <Input
                    type="password"
                    value={config.secretAccessKey ?? ""}
                    onChange={(event) => setConfig((prev) => ({ ...prev, secretAccessKey: event.target.value }))}
                    placeholder="secret"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(config.forcePathStyle)}
                  onChange={(event) => setConfig((prev) => ({ ...prev, forcePathStyle: event.target.checked }))}
                />
                Force path style (recommended for MinIO)
              </label>
            </>
          )}

          <p className="text-xs text-slate-600">
            Server stores this config in JSON and upload adapter uses it directly for Local, S3, or MinIO.
          </p>

          <div className="flex items-center gap-2">
            <Button onClick={() => void save()}>Save</Button>
            {saved && <span className="text-sm text-emerald-700">Saved</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
