#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Waiting for TimescaleDB container..."
until docker compose exec -T timescaledb pg_isready -U postgres -d halal_iot >/dev/null 2>&1; do
  sleep 1
done

echo "Initializing TimescaleDB schema..."
docker compose exec -T timescaledb psql -U postgres -d halal_iot <<'SQL'
CREATE EXTENSION IF NOT EXISTS timescaledb;

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

SELECT create_hypertable('iot_logs', 'created_at', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS idx_iot_logs_batch_created_at ON iot_logs (batch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_iot_logs_unit_created_at ON iot_logs (unit_id, created_at DESC);
SQL

echo "TimescaleDB is ready."
