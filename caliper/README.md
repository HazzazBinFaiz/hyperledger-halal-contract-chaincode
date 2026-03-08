# Caliper Benchmark Setup for `halal_contract`

This folder provides a ready-to-run Caliper benchmark to produce two figures:
- Throughput vs transaction send rate (write vs read)
- Average latency by critical smart contract function

## 1. Prerequisites

1. Fabric test network is up and channel/chaincode are deployed:
   - Channel: `mychannel`
   - Chaincode ID: `halal_contract`
2. Node.js and npm installed.
3. Python 3 installed (for plotting).

## 2. Install dependencies

From this `caliper/` directory:

```bash
npm install
python3 -m pip install -r scripts/requirements.txt
```

## 3. Generate network config

This auto-detects Org1 User1 private key and writes `config/networkConfig.yaml`:

```bash
bash scripts/generate-network-config.sh
```

## 4. Run benchmarks

```bash
bash scripts/run-benchmarks.sh
```

This generates three report folders:
- `results/throughput-write-report/`
- `results/throughput-read-report/`
- `results/latency-report/`

## 5. Generate figures

```bash
python3 scripts/plot_figures.py
```

Generated images:
- `results/figures/figure-throughput-vs-load.png`
- `results/figures/figure-average-latency.png`

## Notes

- You can tune load levels in:
  - `config/bench-throughput-write.yaml`
  - `config/bench-throughput-read.yaml`
- You can tune critical functions in:
  - `config/bench-latency.yaml`
- If your chaincode name or channel differ, update:
  - `config/networkConfig.template.yaml`
  - benchmark `contractId` arguments
