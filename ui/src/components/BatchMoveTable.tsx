"use client"

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Checkbox} from "@/components/ui/checkbox"
import {PoultryBatch} from "@/lib/actions/batch"

type Props = {
    batches: PoultryBatch[]
    selected: number[]
    onSelect: (ids: number[]) => void
}

export default function BatchMoveTable({batches, selected, onSelect}: Props) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead/>
                    <TableHead>ID</TableHead>
                    <TableHead>Farm</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Breed</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {batches.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                            No farm found
                        </TableCell>
                    </TableRow>
                ) : batches.map(batch => (
                    <TableRow key={batch.id}>
                        <TableCell>
                            <Checkbox
                                checked={selected.includes(batch.id)}
                                onCheckedChange={() => onSelect([...selected, batch.id])}
                            />
                        </TableCell>
                        <TableCell>{batch.id}</TableCell>
                        <TableCell>{batch.farm_id}</TableCell>
                        <TableCell>{batch.status}</TableCell>
                        <TableCell>{batch.breed_type}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
