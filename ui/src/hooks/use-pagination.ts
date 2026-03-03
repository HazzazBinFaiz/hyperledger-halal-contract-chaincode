"use client"

import { useMemo, useState } from "react"

export function usePagination<T>(rows: T[], defaultPageSize = 10) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, currentPage, pageSize])

  const next = () => setPage((prev) => Math.min(totalPages, prev + 1))
  const prev = () => setPage((prev) => Math.max(1, prev - 1))
  const reset = () => setPage(1)

  return {
    page: currentPage,
    pageSize,
    total,
    totalPages,
    pagedRows,
    setPage,
    setPageSize,
    next,
    prev,
    reset,
  }
}
