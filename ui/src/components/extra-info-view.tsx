"use client"

import { useMemo, useState } from "react"
import Image from "next/image"

type Props = {
  info: Record<string, string | number | boolean>
  compactThreshold?: number
}

type AssetMeta = {
  type?: "image" | "file"
  hash: string
  path: string
  filename?: string
  provider?: string
  mimetype?: string
}

function parseAssetMeta(value: string): AssetMeta | null {
  try {
    const obj = JSON.parse(value) as AssetMeta
    if (obj && obj.hash && obj.path) {
      return obj
    }
    return null
  } catch {
    return null
  }
}

function isImageAsset(asset: AssetMeta) {
  if (asset.type === "image") return true
  return (asset.mimetype || "").startsWith("image/")
}

export default function ExtraInfoView({ info, compactThreshold = 3 }: Props) {
  const entries = useMemo(() => Object.entries(info || {}), [info])
  const [expanded, setExpanded] = useState(false)
  const [preview, setPreview] = useState<{ path: string; filename: string } | null>(null)

  if (!entries.length) {
    return <span>-</span>
  }

  const visible = expanded ? entries : entries.slice(0, compactThreshold)
  const hiddenCount = Math.max(0, entries.length - visible.length)

  return (
    <div className="space-y-1">
      {visible.map(([key, value]) => {
        const raw = String(value)
        const asset = parseAssetMeta(raw)

        if (asset) {
          const filename = asset.filename || asset.hash
          const image = isImageAsset(asset)

          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              {image ? (
                <Image
                  src={asset.path}
                  alt={filename}
                  width={32}
                  height={32}
                  className="h-8 w-8 cursor-pointer rounded border object-cover"
                  onClick={() => setPreview({ path: asset.path, filename })}
                />
              ) : (
                <a
                  href={asset.path}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded border bg-slate-100 font-semibold text-slate-700"
                >
                  F
                </a>
              )}
              <div className="min-w-0">
                <p className="truncate">
                  <span className="font-medium">{key}:</span>{" "}
                  {image ? (
                    <button type="button" className="underline-offset-4 hover:underline" onClick={() => setPreview({ path: asset.path, filename })}>
                      {filename}
                    </button>
                  ) : (
                    <a href={asset.path} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                      {filename}
                    </a>
                  )}
                </p>
                <p className="truncate text-[11px] text-slate-500">{asset.hash}</p>
              </div>
            </div>
          )
        }

        return (
          <div key={key} className="text-xs">
            - <span className="font-medium">{key}</span>: {raw}
          </div>
        )
      })}

      {entries.length > compactThreshold && (
        <button
          type="button"
          className="text-xs font-medium text-blue-700 underline-offset-4 hover:underline"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more`}
        </button>
      )}

      {preview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <div className="space-y-2">
            <Image src={preview.path} alt={preview.filename} width={1200} height={800} className="max-h-[85vh] max-w-[85vw] rounded-lg border bg-white" />
            <p className="text-center text-xs text-white">{preview.filename}</p>
          </div>
        </div>
      )}
    </div>
  )
}
