"use client"

import { useState, useTransition, useEffect } from "react"
import { createPoultryBatch } from "@/lib/actions/batch"
import { listFarms, Farm } from "@/lib/actions/farm"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { toast } from "sonner"
import ExtraInfoEditor from "@/components/extra-info-editor"

const schema = z.object({
    farm_id: z.coerce.number().min(1, "Farm is required"),
    age_of_chicken: z.coerce.number(),
    breed_type: z.string().min(1),
    ideal_temperature: z.coerce.number(),
})

type FormValues = z.infer<typeof schema>

type ExtraRow = {
  key: string
  value: string
  type?: "text" | "boolean" | "image" | "file"
  boolValue?: boolean
  removable?: boolean
  lockedType?: boolean
}

export default function BatchesCreateClient() {
    const [farms, setFarms] = useState<Farm[]>([])
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const [extraRows, setExtraRows] = useState<ExtraRow[]>([
      { key: "", value: "", type: "text", boolValue: false, removable: true, lockedType: true },
    ])

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            farm_id: 0,
            age_of_chicken: 0,
            breed_type: "",
            ideal_temperature: 0,
        },
    })

    useEffect(() => {
        listFarms().then(setFarms)
    }, [])

    const onSubmit = (data: FormValues) => {
        const extraObject = extraRows
            .filter((row) => row.key.trim())
            .reduce((acc, row) => {
                if ((row.type ?? "text") === "boolean") {
                    acc[row.key.trim()] = row.boolValue ? "YES" : "NO"
                    return acc
                }

                acc[row.key.trim()] = row.value || ""
                return acc
            }, {} as Record<string, string>)

        startTransition(async () => {
            try {
                await createPoultryBatch({
                    ...data,
                    add_date: new Date().toISOString(),
                    extra_info: extraObject,
                })

                reset()
                setExtraRows([{ key: "", value: "", type: "text", boolValue: false, removable: true, lockedType: true }])

                toast("Batch Created", {
                    description: "Poultry batch added successfully",
                })
                router.refresh()
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : "Failed to create batch"
                toast("Error", { description: message })
            }
        })
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create Poultry Batch</CardTitle>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label>Farm</Label>

                                <Select
                                    onValueChange={(value) =>
                                        setValue("farm_id", Number(value), { shouldValidate: true })
                                    }
                                >
                                    <SelectTrigger className="mt-2 w-full">
                                        <SelectValue placeholder="Select Farm" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {farms.map((farm) => (
                                            <SelectItem key={farm.id} value={String(farm.id)}>
                                                {farm.id} : {farm.name} ({farm.address})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {errors.farm_id && (
                                    <p className="mt-1 text-sm text-red-500">{errors.farm_id.message}</p>
                                )}
                            </div>

                            <div>
                                <Label>Age of Chicken (days)</Label>
                                <Input className="mt-2" {...register("age_of_chicken")} />
                            </div>

                            <div>
                                <Label>Breed Type</Label>
                                <Input className="mt-2" {...register("breed_type")} />
                            </div>

                            <div>
                                <Label>Ideal Temperature (°C)</Label>
                                <Input className="mt-2" {...register("ideal_temperature")} />
                            </div>
                        </div>

                        <ExtraInfoEditor rows={extraRows} onChange={setExtraRows} />

                        <Button type="submit" disabled={isPending} className="w-full">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPending ? "Creating..." : "Create Batch"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
