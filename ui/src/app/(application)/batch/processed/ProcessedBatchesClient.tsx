"use client"

import { useMemo, useState } from "react"
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
import ExtraInfoView from "@/components/extra-info-view"
import TableFilters from "@/components/list/table-filters"
import PaginationControls from "@/components/list/pagination-controls"
import { usePagination } from "@/hooks/use-pagination"

export default function ProcessedBatchesClient({
  initialUnits,
}: {
  initialUnits: ProcessedBatch[]
}) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("ALL")

  const statuses = useMemo(
    () => Array.from(new Set(initialUnits.map((unit) => unit.status))).sort(),
    [initialUnits]
  )

  const filtered = useMemo(() => {
    return initialUnits.filter((unit) => {
      const statusMatch = status === "ALL" || unit.status === status
      const searchTerm = search.trim()
      const searchMatch = !searchTerm || String(unit.unit_id).includes(searchTerm) || String(unit.original_batch_id).includes(searchTerm)
      return statusMatch && searchMatch
    })
  }, [initialUnits, search, status])

  const pagination = usePagination(filtered, 10)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Processed Units</CardTitle>
        </CardHeader>
        <CardContent>
          <TableFilters
            search={search}
            onSearchChange={(value) => {
              setSearch(value)
              pagination.reset()
            }}
            status={status}
            statuses={statuses}
            onStatusChange={(value) => {
              setStatus(value)
              pagination.reset()
            }}
          />

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
              {pagination.pagedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                    No processed units found
                  </TableCell>
                </TableRow>
              ) : (
                pagination.pagedRows.map((unit) => (
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
                    <TableCell><ExtraInfoView info={unit.extra_info} /></TableCell>
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

          <PaginationControls
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPrev={pagination.prev}
            onNext={pagination.next}
            onPageSizeChange={(size) => {
              pagination.setPageSize(size)
              pagination.reset()
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
