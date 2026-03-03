"use client"

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Checkbox} from "@/components/ui/checkbox"
import {PoultryBatch} from "@/lib/actions/batch"
import {Button} from "@/components/ui/button";
import {Search} from "lucide-react";
import Link from "next/link";

type Props = {
    batches: PoultryBatch[]
    selected: number[]
    onSelect: (ids: number[]) => void
}

export default function BatchMoveTable({batches, selected, onSelect}: Props) {
    const toggle = (batchId: number) => {
        if (selected.includes(batchId)) {
            onSelect(selected.filter((id) => id !== batchId))
            return
        }

        onSelect([...selected, batchId])
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead/>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Farm ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className={'text-right'}>Trace</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {batches.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                            No Batch found
                        </TableCell>
                    </TableRow>
                ) : batches.map(batch => (
                    <TableRow key={batch.id}>
                        <TableCell>
                            <Checkbox
                                checked={selected.includes(batch.id)}
                                onCheckedChange={() => toggle(batch.id)}
                            />
                        </TableCell>
                        <TableCell>
                            <Link href={`/batch/trace?id=${batch.id}`} className="font-medium underline-offset-4 hover:underline">
                                {batch.id}
                            </Link>
                        </TableCell>
                        <TableCell>{batch.farm_id}</TableCell>
                        <TableCell>{batch.status}</TableCell>
                        <TableCell className="text-right">
                            <Button
                                size="icon"
                                variant="ghost"
                                asChild
                            >
                                <Link href={`/batch/trace?id=${batch.id}`}>
                                    <Search className="w-4 h-4" />
                                </Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
