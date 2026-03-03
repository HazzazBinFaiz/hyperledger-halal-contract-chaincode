"use client"

import { useMemo, useState } from "react"
import { PoultryBatch } from "@/lib/actions/batch"
import { Search } from "lucide-react"
import Link from "next/link"

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

export default function BatchesClient({
  initialBatches,
}: {
  initialBatches: PoultryBatch[]
}) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("ALL")

  const statuses = useMemo(
    () => Array.from(new Set(initialBatches.map((batch) => batch.status))).sort(),
    [initialBatches]
  )

  const filtered = useMemo(() => {
    return initialBatches.filter((batch) => {
      const statusMatch = status === "ALL" || batch.status === status
      const searchMatch = !search.trim() || String(batch.id).includes(search.trim())
      return statusMatch && searchMatch
    })
  }, [initialBatches, search, status])

  const pagination = usePagination(filtered, 10)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Poultry Batches</CardTitle>
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
              {pagination.pagedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                    No batches found
                  </TableCell>
                </TableRow>
              ) : (
                pagination.pagedRows.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <Link href={`/batch/trace?id=${batch.id}`} className="font-medium underline-offset-4 hover:underline">
                        {batch.id}
                      </Link>
                    </TableCell>
                    <TableCell>{batch.farm_id}</TableCell>
                    <TableCell>{batch.status}</TableCell>
                    <TableCell>{batch.breed_type}</TableCell>
                    <TableCell>{batch.ideal_temperature}°C</TableCell>
                    <TableCell><ExtraInfoView info={batch.extra_info} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" asChild>
                        <Link href={`/batch/trace?id=${batch.id}`}>
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
