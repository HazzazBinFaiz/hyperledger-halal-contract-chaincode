#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CALIPER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${CALIPER_DIR}"

./scripts/generate-network-config.sh

# Avoid premature aborts under high-load rounds on test-network.
export CALIPER_FABRIC_TIMEOUT_INVOKEORQUERY="${CALIPER_FABRIC_TIMEOUT_INVOKEORQUERY:-300}"

mkdir -p results/throughput-write-report results/throughput-read-report results/latency-report

npx caliper bind --caliper-bind-sut fabric:2.5
bash ./scripts/patch-caliper-latency-ms.sh

npx caliper launch manager \
  --caliper-workspace . \
  --caliper-networkconfig config/networkConfig.yaml \
  --caliper-benchconfig config/bench-throughput-write.yaml \
  --caliper-flow-only-test \
  --caliper-report-path results/throughput-write-report/report \
  --caliper-report-format json

npx caliper launch manager \
  --caliper-workspace . \
  --caliper-networkconfig config/networkConfig.yaml \
  --caliper-benchconfig config/bench-throughput-read.yaml \
  --caliper-flow-only-test \
  --caliper-report-path results/throughput-read-report/report \
  --caliper-report-format json

npx caliper launch manager \
  --caliper-workspace . \
  --caliper-networkconfig config/networkConfig.yaml \
  --caliper-benchconfig config/bench-latency.yaml \
  --caliper-flow-only-test \
  --caliper-report-path results/latency-report/report \
  --caliper-report-format json

echo "All benchmarks completed."
echo "Now run: python3 scripts/plot_figures.py"
