#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CALIPER_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATE="${CALIPER_DIR}/config/networkConfig.template.yaml"
OUTPUT="${CALIPER_DIR}/config/networkConfig.yaml"

TEST_NETWORK_DIR=""
for candidate in "${CALIPER_DIR}/../../test-network" "${CALIPER_DIR}/../test-network"; do
  if [[ -d "${candidate}" ]]; then
    TEST_NETWORK_DIR="$(cd "${candidate}" && pwd)"
    break
  fi
done

if [[ -z "${TEST_NETWORK_DIR}" ]]; then
  echo "Could not find test-network directory. Expected at ../../test-network or ../test-network from caliper/."
  exit 1
fi

KEY_PATH=$(ls "${TEST_NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore"/* 2>/dev/null | head -n 1 || true)

if [[ -z "${KEY_PATH}" ]]; then
  echo "Could not find Org1 private key under ${TEST_NETWORK_DIR}; make sure test-network is up and users are enrolled."
  exit 1
fi

CERT_PATH="${TEST_NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/cert.pem"
CONNECTION_PROFILE_PATH="${TEST_NETWORK_DIR}/organizations/peerOrganizations/org1.example.com/connection-org1.json"

if [[ ! -f "${CERT_PATH}" ]]; then
  echo "Missing Org1 cert: ${CERT_PATH}"
  exit 1
fi

if [[ ! -f "${CONNECTION_PROFILE_PATH}" ]]; then
  echo "Missing Org1 connection profile: ${CONNECTION_PROFILE_PATH}"
  exit 1
fi

sed \
  -e "s|REPLACE_ORG1_KEY_PATH|${KEY_PATH}|g" \
  -e "s|REPLACE_ORG1_CERT_PATH|${CERT_PATH}|g" \
  -e "s|REPLACE_ORG1_CONNECTION_PROFILE_PATH|${CONNECTION_PROFILE_PATH}|g" \
  "${TEMPLATE}" > "${OUTPUT}"

echo "Generated ${OUTPUT}"
echo "Using test-network: ${TEST_NETWORK_DIR}"
echo "Using key: ${KEY_PATH}"
