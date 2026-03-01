"use client"

import { useState, useTransition } from "react"
import { createFarm, listFarms, Farm } from "@/lib/actions/farm"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
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
import { Loader2, Plus, Trash } from "lucide-react"
import { toast } from "sonner"

const schema = z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    extra_info: z.array(
        z.object({
            key: z.string().optional(),
            value: z.string().optional(),
        })
    ),
})

type FormValues = z.infer<typeof schema>

export default function FarmsClient({
    initialFarms,
}: {
    initialFarms: Farm[]
}) {
    const [farms, setFarms] = useState<Farm[]>(initialFarms)
    const [isPending, startTransition] = useTransition()

    const {
        register,
        control,
        handleSubmit,
        reset,
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            address: "",
            extra_info: [{ key: "", value: "" }],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "extra_info",
    })

    const onSubmit = (data: FormValues) => {
        const additionalObject = data.extra_info
            .filter(f => f.key?.trim())
            .reduce((acc, curr) => {
                acc[curr.key!] = curr.value || ""
                return acc
            }, {} as Record<string, string>)

        startTransition(async () => {
            try {
                await createFarm({
                    name: data.name,
                    address: data.address,
                    extra_info: additionalObject,
                })

                const updated = await listFarms()
                setFarms(updated)

                reset()

                toast("Farm Created", {
                    description: "Farm added successfully",
                })

            } catch {
                toast("Error", {
                    description: "Failed to create farm",
                })
            }
        })
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">

            {/* ================= FORM CARD ================= */}
            <Card className="w-full mx-auto">
                <CardHeader>
                    <CardTitle>Create New Farm</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex justify-center flex-wrap space-y-6">

                        <div className="w-full md:w-1/2">
                            <div className="p-2">
                                <Label>Name *</Label>
                                <Input className="mt-2" {...register("name")} />
                            </div>
                        </div>

                        <div className="w-full md:w-1/2">
                            <div className="p-2">
                                <Label>Address *</Label>
                                <Input className="mt-2" {...register("address")} />
                            </div>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="flex justify-between">
                                <Label>Additional Info</Label>
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
                            {isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {isPending ? "Creating..." : "Create Farm"}
                        </Button>

                    </form>
                </CardContent>
            </Card>

            {/* ================= TABLE ================= */}

            <Card>
                <CardHeader>
                    <CardTitle>Farms</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Farm ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Additional Info</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {farms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                        No farm found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                farms.map(farm => (
                                    <TableRow key={farm.id}>
                                        <TableCell>{farm.id}</TableCell>
                                        <TableCell>{farm.name}</TableCell>
                                        <TableCell>{farm.address}</TableCell>
                                        <TableCell>
                                            <div className="space-y-1 text-sm">
                                                {Object.entries(farm.extra_info).length === 0 && "—"}
                                                {Object.entries(farm.extra_info).map(([k, v]) => (
                                                    <div key={k}>
                                                        - <span className="font-medium">{k}</span> : {v}
                                                    </div>
                                                ))}
                                            </div>
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
