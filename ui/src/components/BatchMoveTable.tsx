"use client"

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Checkbox} from "@/components/ui/checkbox"
import {PoultryBatch} from "@/lib/actions/batch"
import {Button} from "@/components/ui/button";
import {Search} from "lucide-react";
import {useRouter} from "next/navigation";

type Props = {
    batches: PoultryBatch[]
    selected: number[]
    onSelect: (ids: number[]) => void
}

export default function BatchMoveTable({batches, selected, onSelect}: Props) {
    const router = useRouter()
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
                                onCheckedChange={() => onSelect([...selected, batch.id])}
                            />
                        </TableCell>
                        <TableCell>{batch.id}</TableCell>
                        <TableCell>{batch.farm_id}</TableCell>
                        <TableCell>{batch.status}</TableCell>
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
                ))}
            </TableBody>
        </Table>
    )
}
