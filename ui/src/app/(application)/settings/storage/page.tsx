"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { defaultStorageConfig, StorageConfig, storageConfigKey } from "@/lib/storage-config"

export default function StorageSettingsPage() {
  const [config, setConfig] = useState<StorageConfig>(() => {
    if (typeof window === "undefined") return defaultStorageConfig
    const raw = localStorage.getItem(storageConfigKey)
    if (!raw) return defaultStorageConfig
    try {
      return { ...defaultStorageConfig, ...JSON.parse(raw) }
    } catch {
      return defaultStorageConfig
    }
  })
  const [saved, setSaved] = useState(false)

  const save = () => {
    localStorage.setItem(storageConfigKey, JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
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
              onChange={(event) => setConfig((prev) => ({ ...prev, provider: event.target.value as StorageConfig["provider"] }))}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="local">Local Filesystem</option>
              <option value="s3">S3 Compatible</option>
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>S3/MinIO Bucket</Label>
              <Input
                value={config.s3Bucket ?? ""}
                onChange={(event) => setConfig((prev) => ({ ...prev, s3Bucket: event.target.value }))}
                placeholder="bucket-name"
              />
            </div>
            <div className="space-y-2">
              <Label>S3/MinIO Endpoint</Label>
              <Input
                value={config.s3Endpoint ?? ""}
                onChange={(event) => setConfig((prev) => ({ ...prev, s3Endpoint: event.target.value }))}
                placeholder="https://s3.amazonaws.com"
              />
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Local provider stores files in app public storage. S3/MinIO settings are saved for future provider integration.
          </p>

          <div className="flex items-center gap-2">
            <Button onClick={save}>Save</Button>
            {saved && <span className="text-sm text-emerald-700">Saved</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
