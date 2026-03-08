# Caliper Benchmark Setup for `halal_contract`

This folder provides a ready-to-run Caliper benchmark to produce two figures:
- Throughput vs transaction send rate (write vs read)
- Average latency by independent non-IoT functions (`createFarmer`, `createSlaughteringHouse`, `createRetailShop`, `createPoultryBatch`)

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
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r scripts/requirements.txt
```

If you open a new terminal later, activate again before plotting:

```bash
source .venv/bin/activate
```

## 3. Generate network config

This auto-detects Org1 User1 private key and writes `config/networkConfig.yaml`:

```bash
bash scripts/generate-network-config.sh
```

## 4. Run benchmarks

```bash
# Optional but recommended for high-load rounds
export CALIPER_FABRIC_TIMEOUT_INVOKEORQUERY=300

bash scripts/run-benchmarks.sh
```

`run-benchmarks.sh` automatically applies a local Caliper patch so latency columns are reported in `ms` instead of `s` (portable across devices after `npm install`).

This generates three report folders:
- `results/throughput-write-report/`
- `results/throughput-read-report/`
- `results/latency-report/`

### Optional High-Load Throughput Sweep (500 to 5000 TPS, step 500)

```bash
bash scripts/run-benchmarks-500-step.sh
```

This script uses dedicated static configs:
- `config/bench-throughput-write-500-step.yaml`
- `config/bench-throughput-read-500-step.yaml`
- `config/bench-latency-highload.yaml`

This generates:
- `results/highload-throughput-write/report`
- `results/highload-throughput-read/report`
- `results/highload-latency-report/report`

## 5. Generate figures

```bash
source .venv/bin/activate
python scripts/plot_figures.py
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
- Write benchmarks on the default 2-org test-network require endorsements from both orgs.
  If `peer0.org2.example.com:9051` becomes unavailable under load, either:
  - keep conservative TPS (the default configs here are tuned for this), or
  - redeploy with a benchmark-only endorsement policy:
    `./network.sh deployCC -ccn halal_contract -ccp ../halal-contract/chaincode-javascript -ccl javascript -ccep \"OR('Org1MSP.peer')\"`

## Optional: Redeploy with OR Endorsement (Either Org Can Endorse)

From `fabric-samples/test-network`:

```bash
./network.sh deployCC \
  -ccn halal_contract \
  -ccp ../halal-contract/chaincode-javascript \
  -ccl javascript \
  -ccep "OR('Org1MSP.peer','Org2MSP.peer')"
```

Verify committed definition:

```bash
peer lifecycle chaincode querycommitted --channelID mychannel --name halal_contract
```
