"use client"

import { useState, useTransition } from "react"
import { createSlaughterHouses, listSlaughterHouses, SlaughterHouse } from "./action"
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
    additionalInfo: z.array(
        z.object({
            key: z.string().optional(),
            value: z.string().optional(),
        })
    ),
})

type FormValues = z.infer<typeof schema>

export default function SlaughterHouseClient({
    initialSlaughterHouses,
}: {
    initialSlaughterHouses: SlaughterHouse[]
}) {
    const [slaughterHouses, setSlaughterHouses] = useState<SlaughterHouse[]>(initialSlaughterHouses)
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
            additionalInfo: [{ key: "", value: "" }],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "additionalInfo",
    })

    const onSubmit = (data: FormValues) => {
        const additionalObject = data.additionalInfo
            .filter(f => f.key?.trim())
            .reduce((acc, curr) => {
                acc[curr.key!] = curr.value || ""
                return acc
            }, {} as Record<string, string>)

        startTransition(async () => {
            try {
                await createSlaughterHouses({
                    name: data.name,
                    address: data.address,
                    additionalInfo: additionalObject,
                })

                const updated = await listSlaughterHouses()
                setSlaughterHouses(updated)

                reset()

                toast("Slaughter House Created", {
                    description: "Slaughter House added successfully",
                })

            } catch {
                toast("Error", {
                    description: "Failed to create slaughter house",
                })
            }
        })
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">

            {/* ================= FORM CARD ================= */}
            <Card className="w-full mx-auto">
                <CardHeader>
                    <CardTitle>Create New Slaughter House</CardTitle>
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
                                        {...register(`additionalInfo.${index}.key`)}
                                    />
                                    <Input
                                        placeholder="Value"
                                        {...register(`additionalInfo.${index}.value`)}
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
                            {isPending ? "Creating..." : "Create Slaughter House"}
                        </Button>

                    </form>
                </CardContent>
            </Card>

            {/* ================= TABLE ================= */}

            <Card>
                <CardHeader>
                    <CardTitle>Slaughter Houses</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Slaughter House ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Additional Info</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {slaughterHouses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                        No slaugheter house found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                slaughterHouses.map(slaughetrHouse => (
                                    <TableRow key={slaughetrHouse.id}>
                                        <TableCell>{slaughetrHouse.id}</TableCell>
                                        <TableCell>{slaughetrHouse.name}</TableCell>
                                        <TableCell>{slaughetrHouse.address}</TableCell>
                                        <TableCell>
                                            <div className="space-y-1 text-sm">
                                                {Object.entries(slaughetrHouse.additionalInfo).length === 0 && "—"}
                                                {Object.entries(slaughetrHouse.additionalInfo).map(([k, v]) => (
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