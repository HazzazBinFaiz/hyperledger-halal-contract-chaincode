"use client"

import Link from "next/link"
import { Search } from "lucide-react"
import { ProcessedBatch } from "@/lib/actions/batch"
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

export default function ProcessedBatchesClient({
  initialUnits,
}: {
  initialUnits: ProcessedBatch[]
}) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Processed Units</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit ID</TableHead>
                <TableHead>Original Batch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Retail Shop</TableHead>
                <TableHead>Extra</TableHead>
                <TableHead className="text-right">Trace</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialUnits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                    No processed units found
                  </TableCell>
                </TableRow>
              ) : (
                initialUnits.map((unit) => (
                  <TableRow key={unit.unit_id}>
                    <TableCell>
                      <Link
                        href={`/batch/processed/trace?id=${unit.unit_id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {unit.unit_id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/batch/trace?id=${unit.original_batch_id}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {unit.original_batch_id}
                      </Link>
                    </TableCell>
                    <TableCell>{unit.status}</TableCell>
                    <TableCell>{unit.weight}</TableCell>
                    <TableCell>{unit.retail_shop_id ?? "-"}</TableCell>
                    <TableCell>
                      {Object.entries(unit.extra_info).length === 0 && "-"}
                      {Object.entries(unit.extra_info).map(([k, v]) => (
                        <div key={k}>
                          - <span className="font-medium">{k}</span>: {v}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" asChild>
                        <Link href={`/batch/processed/trace?id=${unit.unit_id}`}>
                          <Search className="h-4 w-4" />
                        </Link>
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
