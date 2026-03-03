"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { defaultStorageConfig, StorageConfig, storageConfigKey } from "@/lib/storage-config"

type ExtraInfoRow = {
  key: string
  label?: string
  value: string
  type?: "text" | "boolean" | "image" | "file"
  boolValue?: boolean
  removable?: boolean
  lockedType?: boolean
}

type Props = {
  rows: ExtraInfoRow[]
  onChange: (rows: ExtraInfoRow[]) => void
  allowImageAdd?: boolean
  allowBooleanAdd?: boolean
  allowFileAdd?: boolean
}

type UploadedFileMeta = {
  type: "image" | "file"
  hash: string
  path: string
  filename: string
  provider: string
  mimetype: string
}

async function sha256Hex(file: File) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const bytes = Array.from(new Uint8Array(hashBuffer))
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export default function ExtraInfoEditor({ rows, onChange, allowImageAdd = true, allowBooleanAdd, allowFileAdd = true }: Props) {
  const [storage] = useState<StorageConfig>(() => {
    if (typeof window === "undefined") return defaultStorageConfig
    const raw = localStorage.getItem(storageConfigKey)
    if (!raw) return defaultStorageConfig
    try {
      return { ...defaultStorageConfig, ...JSON.parse(raw) }
    } catch {
      return defaultStorageConfig
    }
  })

  const update = (index: number, patch: Partial<ExtraInfoRow>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const addText = () => onChange([...rows, { key: "", value: "", type: "text", boolValue: false, removable: true, lockedType: true }])
  const addBoolean = () => onChange([...rows, { key: "", value: "NO", type: "boolean", boolValue: false, removable: true, lockedType: true }])
  const addImage = () => onChange([...rows, { key: "", value: "", type: "image", boolValue: false, removable: true, lockedType: true }])
  const addFile = () => onChange([...rows, { key: "", value: "", type: "file", boolValue: false, removable: true, lockedType: true }])

  const remove = (index: number) => onChange(rows.filter((_, i) => i !== index))

  const uploadAsset = async (index: number, file: File, type: "image" | "file") => {
    const hash = await sha256Hex(file)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("hash", hash)
    formData.append("provider", storage.provider)
    formData.append("localBasePath", storage.localBasePath)

    const response = await fetch("/api/storage/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string }
      throw new Error(errorData.error || "Failed to upload file")
    }

    const uploaded = (await response.json()) as Omit<UploadedFileMeta, "type">
    const value: UploadedFileMeta = { ...uploaded, type }
    update(index, { value: JSON.stringify(value), type })
  }

  return (
    <div className="space-y-3">
      <Label>Additional Info</Label>
      {rows.map((row, index) => {
        const type = row.type ?? "text"
        return (
          <div key={`row-${index}`} className="space-y-2 rounded-md border p-2">
            <div className="grid items-center gap-2 md:grid-cols-[220px_1fr_auto]">
              <Label className="text-xs text-slate-600">Key</Label>
              <Label className="text-xs text-slate-600">Value</Label>
              <div />

              <Input
                placeholder="Key"
                value={row.key}
                disabled={row.removable === false}
                onChange={(event) => update(index, { key: event.target.value })}
              />

              {type === "text" && (
                <Input
                  placeholder={row.label || "Value"}
                  value={row.value}
                  onChange={(event) => update(index, { value: event.target.value })}
                />
              )}

              {type === "boolean" && (
                <div className="flex h-10 items-center justify-between rounded-md border px-3">
                  <span className="text-sm text-slate-700">{row.boolValue ? "YES" : "NO"}</span>
                  <Switch
                    checked={row.boolValue ?? false}
                    onCheckedChange={(checked) => update(index, { boolValue: checked, value: checked ? "YES" : "NO" })}
                  />
                </div>
              )}

              {(type === "image" || type === "file") && (
                <div className="space-y-1">
                  <Input
                    type="file"
                    accept={type === "image" ? "image/*" : undefined}
                    onChange={async (event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      try {
                        await uploadAsset(index, file, type)
                      } catch (error) {
                        console.error(error)
                        alert(error instanceof Error ? error.message : "Upload failed")
                      }
                    }}
                  />
                  {row.value && <p className="text-xs text-slate-600">{type === "image" ? "Image" : "File"} metadata ready</p>}
                </div>
              )}

              {row.removable !== false ? (
                <Button type="button" variant="ghost" onClick={() => remove(index)}>
                  Remove
                </Button>
              ) : (
                <div className="text-xs font-medium text-slate-500">Locked</div>
              )}
            </div>
          </div>
        )
      })}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={addText}>
          Add
        </Button>
        {allowBooleanAdd && (
          <Button type="button" variant="outline" onClick={addBoolean}>
            Add Boolean
          </Button>
        )}
        {allowImageAdd && (
          <Button type="button" variant="outline" onClick={addImage}>
            Add Image
          </Button>
        )}
        {allowFileAdd && (
          <Button type="button" variant="outline" onClick={addFile}>
            Add File
          </Button>
        )}
      </div>
    </div>
  )
}
