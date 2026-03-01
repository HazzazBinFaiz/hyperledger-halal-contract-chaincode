"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    type?: string
    extraInfoConfig?: {
        presets?: ExtraInfoPreset[]
    }
}

type Props = {
    title: string
    fields: Field[]
    onSubmit: (data: any) => Promise<void>
}

export default function BatchMoveForm({ title, fields, onSubmit }: Props) {
    const [isPending, startTransition] = useTransition()

    const defaultExtraInfo =
        fields.find(f => f.name === "extra_info")?.extraInfoConfig?.presets?.map(p => ({
            key: p.key,
            value: p.value || "",
            required: p.required || false,
            removable: p.removable !== false,
        })) || [{ key: "", value: "", removable: true }]

    const { register, handleSubmit, control, getValues } = useForm({
        defaultValues: {
            extra_info: defaultExtraInfo,
        },
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
                    acc[curr.key] = curr.value || ""
                    return acc
                }, {})

            data.extra_info = extraObject
        }

        startTransition(() => onSubmit(data))
    }

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={handleSubmit(submitHandler)}
                    className="space-y-4 flex flex-wrap"
                >
                    {fields.map(field => {
                        if (field.name === "extra_info") {
                            return (
                                <div key="extra_info" className="w-full space-y-4">
                                    <div className="flex justify-between">
                                        <Label>{field.label}</Label>
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

                                    {extraFields.map((item, index) => {
                                        const removable = getValues(
                                            `extra_info.${index}.removable`
                                        )

                                        const required = getValues(
                                            `extra_info.${index}.required`
                                        )

                                        return (
                                            <div key={item.id} className="flex gap-2">
                                                <Input
                                                    placeholder="Key"
                                                    disabled={!removable}
                                                    {...register(`extra_info.${index}.key`)}
                                                />
                                                <Input
                                                    placeholder="Value"
                                                    {...register(
                                                        `extra_info.${index}.value`,
                                                        { required: required }
                                                    )}
                                                />
                                                {removable && (
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => remove(index)}
                                                    >
                                                        <Trash className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        }

                        return (
                            <div key={field.name} className="w-full md:w-1/2 p-2">
                                <Label>{field.label}</Label>
                                <Input
                                    type={field.type || "text"}
                                    className="mt-2"
                                    {...register(field.name)}
                                />
                            </div>
                        )
                    })}

                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Submit
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
