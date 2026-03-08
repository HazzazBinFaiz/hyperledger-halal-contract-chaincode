import crypto from "node:crypto"
import { Pool } from "pg"

export type IoTLogPayload = {
  batch_id: number
  unit_id?: string | null
  longitude: number
  latitude: number
  temperature: number
  extra_info: Record<string, string>
}

export type IoTLogRecord = {
  id: number
  created_at: string
  batch_id: number
  unit_id: string | null
  longitude: number
  latitude: number
  temperature: number
  payload_hash: string
  extra_info: Record<string, string>
}

const connectionString = process.env.TIMESCALEDB_URL ?? "postgres://postgres:postgres@localhost:5432/halal_iot"
const pool = new Pool({ connectionString })

let schemaReady = false

async function ensureSchema() {
  if (schemaReady) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS iot_logs (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      batch_id BIGINT NOT NULL,
      unit_id TEXT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      temperature DOUBLE PRECISION NOT NULL,
      payload_hash TEXT NOT NULL,
      extra_info JSONB NOT NULL DEFAULT '{}'::jsonb
    );
  `)

  await pool.query(`
    SELECT create_hypertable('iot_logs', 'created_at', if_not_exists => TRUE);
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_iot_logs_batch_created_at ON iot_logs (batch_id, created_at DESC);
  `)

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_iot_logs_unit_created_at ON iot_logs (unit_id, created_at DESC);
  `)

  schemaReady = true
}

export function computeIoTLogHash(payload: IoTLogPayload): string {
  const canonical = JSON.stringify({
    batch_id: payload.batch_id,
    unit_id: payload.unit_id ?? null,
    longitude: payload.longitude,
    latitude: payload.latitude,
    temperature: payload.temperature,
    extra_info: Object.keys(payload.extra_info || {})
      .sort()
      .reduce<Record<string, string>>((acc, key) => {
        acc[key] = payload.extra_info[key]
        return acc
      }, {}),
  })

  return crypto.createHash("sha256").update(canonical).digest("hex")
}

export async function insertIoTLog(payload: IoTLogPayload): Promise<IoTLogRecord> {
  await ensureSchema()

  const payloadHash = computeIoTLogHash(payload)
  const result = await pool.query(
    `
      INSERT INTO iot_logs (
        batch_id,
        unit_id,
        longitude,
        latitude,
        temperature,
        payload_hash,
        extra_info
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      RETURNING
        id,
        created_at,
        batch_id,
        unit_id,
        longitude,
        latitude,
        temperature,
        payload_hash,
        extra_info;
    `,
    [
      payload.batch_id,
      payload.unit_id ?? null,
      payload.longitude,
      payload.latitude,
      payload.temperature,
      payloadHash,
      JSON.stringify(payload.extra_info ?? {}),
    ]
  )

  const row = result.rows[0]
  return {
    id: Number(row.id),
    created_at: new Date(row.created_at).toISOString(),
    batch_id: Number(row.batch_id),
    unit_id: row.unit_id ?? null,
    longitude: Number(row.longitude),
    latitude: Number(row.latitude),
    temperature: Number(row.temperature),
    payload_hash: String(row.payload_hash),
    extra_info: (row.extra_info ?? {}) as Record<string, string>,
  }
}

export async function getIoTLogsByBatchId(batchId: number): Promise<IoTLogRecord[]> {
  await ensureSchema()
  const result = await pool.query(
    `
      SELECT
        id,
        created_at,
        batch_id,
        unit_id,
        longitude,
        latitude,
        temperature,
        payload_hash,
        extra_info
      FROM iot_logs
      WHERE batch_id = $1
      ORDER BY created_at ASC;
    `,
    [batchId]
  )

  return result.rows.map((row) => ({
    id: Number(row.id),
    created_at: new Date(row.created_at).toISOString(),
    batch_id: Number(row.batch_id),
    unit_id: row.unit_id ?? null,
    longitude: Number(row.longitude),
    latitude: Number(row.latitude),
    temperature: Number(row.temperature),
    payload_hash: String(row.payload_hash),
    extra_info: (row.extra_info ?? {}) as Record<string, string>,
  }))
}

export async function getIoTLogsByUnitId(unitId: string): Promise<IoTLogRecord[]> {
  await ensureSchema()
  const result = await pool.query(
    `
      SELECT
        id,
        created_at,
        batch_id,
        unit_id,
        longitude,
        latitude,
        temperature,
        payload_hash,
        extra_info
      FROM iot_logs
      WHERE unit_id = $1
      ORDER BY created_at ASC;
    `,
    [unitId]
  )

  return result.rows.map((row) => ({
    id: Number(row.id),
    created_at: new Date(row.created_at).toISOString(),
    batch_id: Number(row.batch_id),
    unit_id: row.unit_id ?? null,
    longitude: Number(row.longitude),
    latitude: Number(row.latitude),
    temperature: Number(row.temperature),
    payload_hash: String(row.payload_hash),
    extra_info: (row.extra_info ?? {}) as Record<string, string>,
  }))
}
