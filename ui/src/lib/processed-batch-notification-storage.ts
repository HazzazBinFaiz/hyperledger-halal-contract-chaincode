"use client"

export type NotifiableUnit = {
  unit_id: string
  status: string
  expiration_date?: string
}

export type NotificationListItem = {
  batchId: string
  state: "PENDING" | "NOTIFIED"
  unitStatus?: string
  expirationDate?: string
}

export const PENDING_NOTIFICATIONS_KEY = "processed_batch_notifications_v2"
export const NOTIFIED_IDS_KEY = "processed_batch_notified_ids_v1"

export function readPendingNotificationsFromStorage(): Record<string, NotifiableUnit> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(PENDING_NOTIFICATIONS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, NotifiableUnit>
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export function writePendingNotificationsToStorage(records: Record<string, NotifiableUnit>) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(PENDING_NOTIFICATIONS_KEY, JSON.stringify(records))
}

export function readNotifiedIdsFromStorage(): Set<string> {
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

export function writeNotifiedIdsToStorage(notifiedIds: Set<string>) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(NOTIFIED_IDS_KEY, JSON.stringify(Array.from(notifiedIds)))
}
