#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CALIPER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
TARGET="${CALIPER_DIR}/node_modules/@hyperledger/caliper-core/lib/manager/report/report.js"

if [[ ! -f "${TARGET}" ]]; then
  echo "Skipping Caliper ms patch: target file not found: ${TARGET}"
  exit 0
fi

# Idempotent patch: only replace if still in seconds format.
if grep -q "Max Latency (s)" "${TARGET}"; then
  sed -i "s/Max Latency (s)/Max Latency (ms)/g" "${TARGET}"
  sed -i "s/Min Latency (s)/Min Latency (ms)/g" "${TARGET}"
  sed -i "s/Avg Latency (s)/Avg Latency (ms)/g" "${TARGET}"

  sed -i "s/CaliperUtils\.millisToSeconds(results\.getMaxLatencyForSuccessful())\.toFixed(2)/Number(results.getMaxLatencyForSuccessful()).toFixed(2)/g" "${TARGET}"
  sed -i "s/CaliperUtils\.millisToSeconds(results\.getMinLatencyForSuccessful())\.toFixed(2)/Number(results.getMinLatencyForSuccessful()).toFixed(2)/g" "${TARGET}"
  sed -i "s/(CaliperUtils\.millisToSeconds(results\.getTotalLatencyForSuccessful() \/ results\.getTotalSuccessfulTx()))\.toFixed(2)/Number(results.getTotalLatencyForSuccessful() \/ results.getTotalSuccessfulTx()).toFixed(2)/g" "${TARGET}"

  echo "Applied Caliper latency unit patch (s -> ms) to ${TARGET}"
else
  echo "Caliper latency ms patch already applied"
fi
