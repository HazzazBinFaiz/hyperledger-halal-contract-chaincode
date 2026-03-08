#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CALIPER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
WRITE_CFG="${CALIPER_DIR}/config/bench-throughput-write-500-step.yaml"
READ_CFG="${CALIPER_DIR}/config/bench-throughput-read-500-step.yaml"
LATENCY_CFG="${CALIPER_DIR}/config/bench-latency-highload.yaml"

cd "${CALIPER_DIR}"

mkdir -p results/highload-throughput-write results/highload-throughput-read results/highload-latency-report

./scripts/generate-network-config.sh

# Keep same safety knobs as default runner
export CALIPER_FABRIC_TIMEOUT_INVOKEORQUERY="${CALIPER_FABRIC_TIMEOUT_INVOKEORQUERY:-300}"

npx caliper bind --caliper-bind-sut fabric:2.5
bash ./scripts/patch-caliper-latency-ms.sh

npx caliper launch manager \
  --caliper-workspace . \
  --caliper-networkconfig config/networkConfig.yaml \
  --caliper-benchconfig "${WRITE_CFG}" \
  --caliper-flow-only-test \
  --caliper-report-path results/highload-throughput-write/report \
  --caliper-report-format json

npx caliper launch manager \
  --caliper-workspace . \
  --caliper-networkconfig config/networkConfig.yaml \
  --caliper-benchconfig "${READ_CFG}" \
  --caliper-flow-only-test \
  --caliper-report-path results/highload-throughput-read/report \
  --caliper-report-format json

npx caliper launch manager \
  --caliper-workspace . \
  --caliper-networkconfig config/networkConfig.yaml \
  --caliper-benchconfig "${LATENCY_CFG}" \
  --caliper-flow-only-test \
  --caliper-report-path results/highload-latency-report/report \
  --caliper-report-format json

echo "High-load benchmarks completed."
echo "Write report: results/highload-throughput-write/report"
echo "Read report:  results/highload-throughput-read/report"
echo "Latency report: results/highload-latency-report/report"
