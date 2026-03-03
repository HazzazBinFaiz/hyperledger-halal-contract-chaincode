"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ProcessedBatch } from "@/lib/actions/batch"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

type Props = {
    units: ProcessedBatch[]
    selected: number[]
    onSelect: (ids: number[]) => void
}

export default function ProcessedBatchMoveTable({ units, selected, onSelect }: Props) {
    const router = useRouter()

    const toggle = (unitId: number) => {
        if (selected.includes(unitId)) {
            onSelect(selected.filter((id) => id !== unitId))
            return
        }
        onSelect([...selected, unitId])
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead />
                    <TableHead>Unit ID</TableHead>
                    <TableHead>Original Batch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Trace</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {units.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                            No processed unit found
                        </TableCell>
                    </TableRow>
                ) : units.map((unit) => (
                    <TableRow key={unit.unit_id}>
                        <TableCell>
                            <Checkbox
                                checked={selected.includes(unit.unit_id)}
                                onCheckedChange={() => toggle(unit.unit_id)}
                            />
                        </TableCell>
                        <TableCell>{unit.unit_id}</TableCell>
                        <TableCell>{unit.original_batch_id}</TableCell>
                        <TableCell>{unit.status}</TableCell>
                        <TableCell className="text-right">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => router.push(`/batch/processed/trace?id=${unit.unit_id}`)}
                            >
                                <Search className="w-4 h-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
