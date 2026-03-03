"use client"

import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useMemo, useState, useTransition } from "react"
import ExtraInfoEditor from "@/components/extra-info-editor"

type ExtraInfoPreset = {
  key: string
  label?: string
  type?: "text" | "boolean" | "image" | "file" | "string"
  value?: string
  required?: boolean
  removable?: boolean
}

type Field = {
  name: string
  label: string
  type?: "text" | "number" | "date" | "datetime-local" | "select"
  required?: boolean
  value?: string
  readOnly?: boolean
  options?: { label: string; value: string }[]
  extraInfoConfig?: {
    presets?: ExtraInfoPreset[]
    allowImageAdd?: boolean
    allowBooleanAdd?: boolean
    allowFileAdd?: boolean
  }
}

type Props = {
  title: string
  fields: Field[]
  onSubmit: (data: Record<string, unknown>) => Promise<void>
}

type ExtraRow = {
  key: string
  label?: string
  value: string
  type?: "text" | "boolean" | "image" | "file"
  boolValue?: boolean
  removable?: boolean
  lockedType?: boolean
}

function inferType(value?: string): ExtraRow["type"] {
  if (!value) return "text"
  if (value === "YES" || value === "NO") return "boolean"
  try {
    const parsed = JSON.parse(value) as { type?: string; mimetype?: string }
    if (parsed?.type === "image") return "image"
    if (parsed?.type === "file") return "file"
    if (typeof parsed?.mimetype === "string" && parsed.mimetype.length > 0) {
      return parsed.mimetype.startsWith("image/") ? "image" : "file"
    }
  } catch {
    // ignore parse error
  }
  return "text"
}

function normalizePresetType(type?: ExtraInfoPreset["type"], value?: string): ExtraRow["type"] {
  if (type === "boolean") return "boolean"
  if (type === "image") return "image"
  if (type === "file") return "file"
  if (type === "text" || type === "string") return "text"
  return inferType(value)
}

export default function BatchMoveForm({ title, fields, onSubmit }: Props) {
  const [isPending, startTransition] = useTransition()

  const defaultExtraRows = useMemo<ExtraRow[]>(() => {
    const presets = fields.find((f) => f.name === "extra_info")?.extraInfoConfig?.presets ?? []
    if (!presets.length) {
      return [{ key: "", value: "", type: "text", boolValue: false, removable: true }]
    }

    return presets.map((preset) => {
      return {
        key: preset.key,
        label: preset.label,
        value: preset.value ?? "",
        type: normalizePresetType(preset.type, preset.value),
        boolValue: preset.value === "YES",
        removable: preset.removable ?? true,
        lockedType: true,
      }
    })
  }, [fields])

  const [extraRows, setExtraRows] = useState<ExtraRow[]>(defaultExtraRows)

  const defaultValues = useMemo(() => {
    return fields.reduce<Record<string, string>>((acc, field) => {
      if (field.name === "extra_info") return acc
      acc[field.name] = field.value ?? ""
      return acc
    }, {})
  }, [fields])

  const { register, handleSubmit } = useForm<Record<string, string>>({ defaultValues })

  const submitHandler = (values: Record<string, string>) => {
    const extra_info = extraRows
      .filter((row) => row.key.trim())
      .reduce<Record<string, string>>((acc, row) => {
        if ((row.type ?? "text") === "boolean") {
          acc[row.key.trim()] = row.boolValue ? "YES" : "NO"
          return acc
        }

        acc[row.key.trim()] = row.value ?? ""
        return acc
      }, {})

    const payload: Record<string, unknown> = {
      ...values,
      extra_info,
    }

    startTransition(() => onSubmit(payload))
  }

  return (
    <Card className="mt-6 shadow-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
          <div className="flex flex-wrap">
            {fields
              .filter((field) => field.name !== "extra_info")
              .map((field) => {
                const isRequired = field.required ?? true

                return (
                  <div key={field.name} className="w-full p-2 md:w-1/2">
                    <Label className="flex items-center gap-1">
                      {field.label}
                      {isRequired && <span className="text-red-500">*</span>}
                    </Label>

                    {field.type === "select" && field.options ? (
                      <select
                        className="mt-2 w-full rounded-md border bg-background p-2"
                        disabled={field.readOnly}
                        {...register(field.name, { required: isRequired })}
                      >
                        <option value="">Select...</option>
                        {field.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type={field.type || "text"}
                        className="mt-2"
                        readOnly={field.readOnly}
                        {...register(field.name, { required: isRequired })}
                      />
                    )}
                  </div>
                )
              })}
          </div>

          {fields.some((field) => field.name === "extra_info") && (
            <ExtraInfoEditor
              rows={extraRows}
              onChange={setExtraRows}
              allowBooleanAdd={fields.find((field) => field.name === "extra_info")?.extraInfoConfig?.allowBooleanAdd}
              allowImageAdd={fields.find((field) => field.name === "extra_info")?.extraInfoConfig?.allowImageAdd}
              allowFileAdd={fields.find((field) => field.name === "extra_info")?.extraInfoConfig?.allowFileAdd}
            />
          )}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
