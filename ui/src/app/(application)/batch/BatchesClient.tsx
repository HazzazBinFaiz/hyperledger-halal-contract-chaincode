"use client"

import { useState,} from "react"
import { PoultryBatch } from "@/lib/actions/batch"
import { useRouter } from "next/navigation"
import { Search,} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"


export default function BatchesClient({
                                          initialBatches,
                                      }: {
    initialBatches: PoultryBatch[]
}) {
    const [batches, setBatches] = useState(initialBatches)
    const router = useRouter()

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
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
                                                    router.push(`/batch/trace/?id=${batch.id}`)
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
