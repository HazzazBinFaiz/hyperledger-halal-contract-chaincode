"use client"

import { Button } from "@/components/ui/button"

type Props = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageSizeChange: (size: number) => void
  onPrev: () => void
  onNext: () => void
}

export default function PaginationControls({
  page,
  pageSize,
  total,
  totalPages,
  onPageSizeChange,
  onPrev,
  onNext,
}: Props) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="text-slate-600">
        Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          className="h-9 rounded-md border bg-background px-2"
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <Button type="button" variant="outline" size="sm" onClick={onPrev} disabled={page <= 1}>
          Prev
        </Button>
        <span className="px-1 text-slate-700">
          {page}/{totalPages}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={onNext} disabled={page >= totalPages}>
          Next
        </Button>
      </div>
    </div>
  )
}
