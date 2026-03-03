"use client"

import { useForm, useFieldArray } from "react-hook-form"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Trash } from "lucide-react"
import { useTransition } from "react"

type ExtraInfoPreset = {
    key: string
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
    }
}

type Props = {
    title: string
    fields: Field[]
    onSubmit: (data: any) => Promise<void>
}

export default function BatchMoveForm({
                                          title,
                                          fields,
                                          onSubmit,
                                      }: Props) {
    const [isPending, startTransition] = useTransition()

    // Extra info defaults
    const defaultExtraInfo =
        fields
            .find(f => f.name === "extra_info")
            ?.extraInfoConfig?.presets?.map(p => ({
            key: p.key,
            value: p.value ?? "",
            required: p.required ?? false,
            removable: p.removable ?? true,
        })) || [{ key: "", value: "", removable: true }]

    // Build default values dynamically
    const defaultValues = fields.reduce((acc: any, field) => {
        if (field.name === "extra_info") {
            acc.extra_info = defaultExtraInfo
        } else {
            acc[field.name] = field.value ?? ""
        }
        return acc
    }, {})

    const { register, handleSubmit, control, getValues } = useForm({
        defaultValues,
    })

    const { fields: extraFields, append, remove } = useFieldArray({
        control,
        name: "extra_info",
    })

    const submitHandler = (data: any) => {
        if (data.extra_info) {
            const extraObject = data.extra_info
                .filter((f: any) => f.key?.trim())
                .reduce((acc: any, curr: any) => {
                    acc[curr.key] = curr.value ?? ""
                    return acc
                }, {})

            data.extra_info = extraObject
        }

        startTransition(() => onSubmit(data))
    }

    return (
        <Card className="mt-6 shadow-md">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>

            <CardContent>
                <form
                    onSubmit={handleSubmit(submitHandler)}
                    className="space-y-6"
                >
                    <div className="flex flex-wrap">
                        {fields.map(field => {
                            const isRequired =
                                field.required ?? true

                            if (field.name === "extra_info") {
                                return (
                                    <div
                                        key="extra_info"
                                        className="w-full space-y-4 px-2"
                                    >
                                        <div className="flex justify-between items-center">
                                            <Label className="flex items-center gap-1">
                                                {field.label}
                                            </Label>
                                        </div>

                                        {extraFields.map(
                                            (item, index) => {
                                                const removable =
                                                    getValues(
                                                        `extra_info.${index}.removable`
                                                    )

                                                const required =
                                                    getValues(
                                                        `extra_info.${index}.required`
                                                    )

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="flex gap-2"
                                                    >
                                                        <Input
                                                            placeholder="Key"
                                                            disabled={
                                                                !removable
                                                            }
                                                            {...register(
                                                                `extra_info.${index}.key`
                                                            )}
                                                        />

                                                        <Input
                                                            placeholder="Value"
                                                            {...register(
                                                                `extra_info.${index}.value`,
                                                                {
                                                                    required:
                                                                    required,
                                                                }
                                                            )}
                                                        />

                                                        {removable && (
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    remove(
                                                                        index
                                                                    )
                                                                }
                                                            >
                                                                <Trash className="w-4 h-4 text-red-500" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                )
                                            }
                                        )}
                                        <div className="w-full flex justify-center">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    append({
                                                        key: "",
                                                        value: "",
                                                        removable: true,
                                                    })
                                                }
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Add
                                            </Button>
                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <div
                                    key={field.name}
                                    className="w-full md:w-1/2 p-2"
                                >
                                    <Label className="flex items-center gap-1">
                                        {field.label}
                                        {isRequired && (
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        )}
                                    </Label>

                                    {field.type === "select" &&
                                    field.options ? (
                                        <select
                                            className="mt-2 w-full border rounded-md p-2 bg-background"
                                            disabled={
                                                field.readOnly
                                            }
                                            {...register(
                                                field.name,
                                                {
                                                    required:
                                                    isRequired,
                                                }
                                            )}
                                        >
                                            <option value="">
                                                Select...
                                            </option>
                                            {field.options.map(
                                                opt => (
                                                    <option
                                                        key={
                                                            opt.value
                                                        }
                                                        value={
                                                            opt.value
                                                        }
                                                    >
                                                        {
                                                            opt.label
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    ) : (
                                        <Input
                                            type={
                                                field.type ||
                                                "text"
                                            }
                                            className="mt-2"
                                            readOnly={
                                                field.readOnly
                                            }
                                            {...register(
                                                field.name,
                                                {
                                                    required:
                                                    isRequired,
                                                }
                                            )}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className="w-full px-2">
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="w-full"
                        >
                            {isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Submit
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
