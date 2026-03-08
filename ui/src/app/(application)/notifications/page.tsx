"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  NotificationListItem,
  readNotifiedIdsFromStorage,
  readPendingNotificationsFromStorage,
} from "@/lib/processed-batch-notification-storage"

function getRows(): NotificationListItem[] {
  const pending = readPendingNotificationsFromStorage()
  const notifiedIds = readNotifiedIdsFromStorage()

  const notifiedRows: NotificationListItem[] = Array.from(notifiedIds).map((batchId) => ({
    batchId,
    state: "NOTIFIED",
  }))

  const pendingRows: NotificationListItem[] = Object.entries(pending)
    .filter(([batchId]) => !notifiedIds.has(batchId))
    .map(([batchId, unit]) => ({
      batchId,
      state: "PENDING",
      unitStatus: unit.status,
      expirationDate: unit.expiration_date,
    }))

  return [...pendingRows, ...notifiedRows].sort((a, b) => {
    if (a.state === b.state) return a.batchId.localeCompare(b.batchId)
    return a.state === "PENDING" ? -1 : 1
  })
}

export default function NotificationsPage() {
  const [rows, setRows] = useState<NotificationListItem[]>(() => getRows())

  const reload = useCallback(() => {
    setRows(getRows())
  }, [])

  useEffect(() => {
    const onStorage = () => reload()
    window.addEventListener("storage", onStorage)
    const interval = window.setInterval(reload, 2000)

    return () => {
      window.removeEventListener("storage", onStorage)
      window.clearInterval(interval)
    }
  }, [reload])

  const countText = useMemo(() => `${rows.length} notifications`, [rows.length])

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <p className="text-sm text-muted-foreground">{countText}</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processed Batch ID</TableHead>
                <TableHead>Notification State</TableHead>
                <TableHead>Unit Status</TableHead>
                <TableHead>Expiration Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No notifications yet
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={`${row.state}-${row.batchId}`}>
                    <TableCell className="font-medium">{row.batchId}</TableCell>
                    <TableCell>{row.state}</TableCell>
                    <TableCell>{row.unitStatus ?? "-"}</TableCell>
                    <TableCell>{row.expirationDate ?? "-"}</TableCell>
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
