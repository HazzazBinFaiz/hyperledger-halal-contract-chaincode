# Halal Traceability Contract

## Clone the repository

```
git clone git@github.com:HazzazBinFaiz/hyperledger-halal-contract-chaincode.git halal-contract
```
## Bring up the test network

```
cd fabric-samples/test-network
```

Run the following command to start the test network:
```
./network.sh up createChannel -ca
```

The test network is deployed with two peer organizations. The `createChannel` flag deploys the network with a single channel named `mychannel` with Org1 and Org2 as channel members.
The -ca flag is used to deploy the network using certificate authorities. This allows you to use each organization's CA to register and enroll new users for this tutorial.

## Deploy the smart contract to the channel

You can use the test network script to deploy the ERC-20 token contract to the channel that was just created. Deploy the smart contract to `mychannel` using the following command:

**To deploy the Contract:**
```
./network.sh deployCC -ccn halal_contract -ccp ../halal-contract/chaincode-javascript/ -ccl javascript
```

The above commands deploys the chaincode with short name `halal_contract`. The smart contract will use the default endorsement policy of majority of channel members.
Since the channel has two members, this implies that we'll need to get peer endorsements from 2 out of the 2 channel members.

Now you are ready to call the deployed smart contract via peer CLI calls. But let's first create the client identities for our scenario.

## Invoking the contract

Shift back to the Org1 terminal, we'll set the following environment variables to operate the `peer` CLI as the minter identity from Org1.
```
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/minter@org1.example.com/msp
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_ADDRESS=localhost:7051
export TARGET_TLS_OPTIONS=(-o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt")
```

The last environment variable above will be utilized within the CLI invoke commands to set the target peers for endorsement, and the target ordering service endpoint and TLS options.

We can then invoke the smart contract function [DO NOT INVOKE, JUST EXAMPLE]
```
peer chaincode invoke "${TARGET_TLS_OPTIONS[@]}" -C mychannel -n token_erc20 -c '{"function":"FunctionName","Args":["args"]}'
```
