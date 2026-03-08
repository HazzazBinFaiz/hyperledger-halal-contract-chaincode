"use client"

import { useEffect } from "react"

type NotifiableUnit = {
  unit_id: string
  status: string
  expiration_date?: string
}

const PENDING_NOTIFICATIONS_KEY = "processed_batch_notifications_v2"
const NOTIFIED_IDS_KEY = "processed_batch_notified_ids_v1"
const POLL_INTERVAL_MS = 60 * 1000

function isBrowserNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window
}

function readPendingNotifications(): Record<string, NotifiableUnit> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(PENDING_NOTIFICATIONS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, NotifiableUnit>
    if (parsed && typeof parsed === "object") return parsed
    return {}
  } catch {
    return {}
  }
}

function writePendingNotifications(records: Record<string, NotifiableUnit>) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(PENDING_NOTIFICATIONS_KEY, JSON.stringify(records))
}

function readNotifiedIds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(NOTIFIED_IDS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.map((id) => String(id)))
  } catch {
    return new Set()
  }
}

function writeNotifiedIds(notifiedIds: Set<string>) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify(Array.from(notifiedIds)))
}

async function ensureNotificationPermission() {
  if (!isBrowserNotificationSupported()) return "denied" as NotificationPermission
  if (Notification.permission === "granted") return "granted"
  if (Notification.permission === "denied") return "denied"
  return Notification.requestPermission()
}

function minutesUntilExpiry(expirationDate: string) {
  const expiresAt = new Date(expirationDate).getTime()
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000))
}

function buildMessage(unit: NotifiableUnit) {
  if (!unit.expiration_date) return `Processed batch ${unit.unit_id} is near expiry.`
  const minutes = minutesUntilExpiry(unit.expiration_date)
  if (minutes >= 60) {
    const hours = (minutes / 60).toFixed(1)
    return `Processed batch ${unit.unit_id} expires in about ${hours} hours.`
  }
  return `Processed batch ${unit.unit_id} expires in about ${minutes} minutes.`
}

export default function ProcessedBatchExpiryNotifier() {
  useEffect(() => {
    let cancelled = false

    const tick = async () => {
      try {
        const response = await fetch("/api/processed-batches/notifiable", {
          method: "GET",
          cache: "no-store",
        })

        if (!response.ok) return

        const payload = (await response.json()) as { units?: NotifiableUnit[] }
        const units = Array.isArray(payload.units) ? payload.units : []
        const pendingNotifications = readPendingNotifications()
        const notifiedIds = readNotifiedIds()
        let pendingChanged = false
        let notifiedIdsChanged = false

        const permission = await ensureNotificationPermission()
        const currentUnitIds = new Set(units.map((unit) => String(unit.unit_id)))

        for (const existingId of Object.keys(pendingNotifications)) {
          if (!currentUnitIds.has(existingId)) {
            delete pendingNotifications[existingId]
            pendingChanged = true
          }
        }

        for (const unit of units) {
          if (cancelled) return
          const batchId = String(unit.unit_id)
          if (notifiedIds.has(batchId)) continue

          if (!pendingNotifications[batchId]) {
            pendingNotifications[batchId] = unit
            pendingChanged = true
          }

          if (permission !== "granted") continue

          new Notification(`Batch ${batchId} nearing expiry`, {
            body: buildMessage(unit),
            tag: `processed-batch-expiry-${batchId}`,
            renotify: false,
          })

          notifiedIds.add(batchId)
          notifiedIdsChanged = true
          delete pendingNotifications[batchId]
          pendingChanged = true
        }

        if (pendingChanged) {
          writePendingNotifications(pendingNotifications)
        }

        if (notifiedIdsChanged) {
          writeNotifiedIds(notifiedIds)
        }
      } catch {
        // Silently ignore poll errors to avoid interrupting UI.
      }
    }

    void tick()
    const interval = window.setInterval(() => {
      void tick()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  return null
}
