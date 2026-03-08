#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CALIPER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATE="${CALIPER_DIR}/config/networkConfig.template.yaml"
OUTPUT="${CALIPER_DIR}/config/networkConfig.yaml"

KEY_PATH=$(ls "${CALIPER_DIR}/../test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore"/* 2>/dev/null | head -n 1 || true)

if [[ -z "${KEY_PATH}" ]]; then
  echo "Could not find Org1 private key under test-network; make sure test-network is up and users are enrolled."
  exit 1
fi

KEY_PATH_REL="../../test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore/$(basename "${KEY_PATH}")"

sed "s|REPLACE_ORG1_KEY_PATH|${KEY_PATH_REL}|g" "${TEMPLATE}" > "${OUTPUT}"

echo "Generated ${OUTPUT}"
echo "Using key: ${KEY_PATH_REL}"
