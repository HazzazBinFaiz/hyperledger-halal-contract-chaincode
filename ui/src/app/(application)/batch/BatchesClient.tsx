"use client"

import { useState, useTransition, useEffect } from "react"
import { createPoultryBatch, getAllBatches, PoultryBatch } from "@/lib/actions/batch"
import { listFarms, Farm } from "@/lib/actions/farm"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Search, Loader2, Plus, Trash } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { toast } from "sonner"

const schema = z.object({
    farm_id: z.coerce.number().min(1, "Farm is required"),
    age_of_chicken: z.coerce.number(),
    breed_type: z.string().min(1),
    ideal_temperature: z.coerce.number(),
    extra_info: z.array(
        z.object({
            key: z.string().optional(),
            value: z.string().optional(),
        })
    ),
})

type FormValues = z.infer<typeof schema>

export default function BatchesClient({
                                          initialBatches,
                                      }: {
    initialBatches: PoultryBatch[]
}) {
    const [batches, setBatches] = useState(initialBatches)
    const [farms, setFarms] = useState<Farm[]>([])
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const {
        register,
        control,
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
            extra_info: [{ key: "", value: "" }],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "extra_info",
    })

    useEffect(() => {
        listFarms().then(setFarms)
    }, [])

    const onSubmit = (data: FormValues) => {
        const extraObject = data.extra_info
            .filter(f => f.key?.trim())
            .reduce((acc, curr) => {
                acc[curr.key!] = curr.value || ""
                return acc
            }, {} as Record<string, string>)

        startTransition(async () => {
            try {
                await createPoultryBatch({
                    ...data,
                    add_date: new Date().toISOString(),
                    extra_info: extraObject,
                })

                const updated = await getAllBatches()
                setBatches(updated)
                reset()

                toast("Batch Created", {
                    description: "Poultry batch added successfully",
                })
            } catch (e: any) {
                toast("Error", { description: e.message })
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

                        <div className="grid md:grid-cols-2 gap-4">

                            {/* FARM SELECT */}
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
                                            <SelectItem
                                                key={farm.id}
                                                value={String(farm.id)}
                                            >
                                                {farm.id} : {farm.name} ({farm.address})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {errors.farm_id && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.farm_id.message}
                                    </p>
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

                        {/* EXTRA INFO */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Extra Info</Label>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => append({ key: "", value: "" })}
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add
                                </Button>
                            </div>

                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-2">
                                    <Input
                                        placeholder="Key"
                                        {...register(`extra_info.${index}.key`)}
                                    />
                                    <Input
                                        placeholder="Value"
                                        {...register(`extra_info.${index}.value`)}
                                    />
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button type="submit" disabled={isPending} className="w-full">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPending ? "Creating..." : "Create Batch"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Poultry Batches</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Farm</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Breed</TableHead>
                                <TableHead>Temp</TableHead>
                                <TableHead>Extra</TableHead>
                                <TableHead className="text-right">Trace</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {batches.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                        No batches found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                batches.map(batch => (
                                    <TableRow key={batch.id}>
                                        <TableCell>{batch.id}</TableCell>
                                        <TableCell>{batch.farm_id}</TableCell>
                                        <TableCell>{batch.status}</TableCell>
                                        <TableCell>{batch.breed_type}</TableCell>
                                        <TableCell>{batch.ideal_temperature}°C</TableCell>
                                        <TableCell>
                                            {Object.entries(batch.extra_info).length === 0 && "—"}
                                            {Object.entries(batch.extra_info).map(([k, v]) => (
                                                <div key={k}>
                                                    - <span className="font-medium">{k}</span>: {v}
                                                </div>
                                            ))}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() =>
                                                    router.push(`/trace/${batch.id}?type=batch`)
                                                }
                                            >
                                                <Search className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    )
}
