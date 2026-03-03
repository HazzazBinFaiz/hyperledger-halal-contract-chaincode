"use client"

import { Input } from "@/components/ui/input"

type Props = {
  search: string
  onSearchChange: (value: string) => void
  status: string
  statuses: string[]
  onStatusChange: (value: string) => void
}

export default function TableFilters({ search, onSearchChange, status, statuses, onStatusChange }: Props) {
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
      <Input placeholder="Search by ID..." value={search} onChange={(event) => onSearchChange(event.target.value)} />
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        className="h-10 rounded-md border bg-background px-3 text-sm"
      >
        <option value="ALL">All Status</option>
        {statuses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  )
}
