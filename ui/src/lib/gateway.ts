import * as grpc from '@grpc/grpc-js'
import {connect, hash, signers, Contract} from '@hyperledger/fabric-gateway'
import * as crypto from 'node:crypto'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import {TextDecoder} from 'node:util'
import {fileURLToPath} from 'node:url'
import {PoultryBatch} from "@/lib/actions/batch";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const channelName: string = envOrDefault('CHANNEL_NAME', 'mychannel')
const chaincodeName: string = envOrDefault('CHAINCODE_NAME', 'halal_contract')
const mspId: string = envOrDefault('MSP_ID', 'Org1MSP')

const cryptoPath: string = envOrDefault(
    'CRYPTO_PATH',
    path.resolve(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        'test-network',
        'organizations',
        'peerOrganizations',
        'org1.example.com'
    )
)

const keyDirectoryPath: string = envOrDefault(
    'KEY_DIRECTORY_PATH',
    path.resolve(
        cryptoPath,
        'users',
        'User1@org1.example.com',
        'msp',
        'keystore'
    )
)

const certDirectoryPath: string = envOrDefault(
    'CERT_DIRECTORY_PATH',
    path.resolve(
        cryptoPath,
        'users',
        'User1@org1.example.com',
        'msp',
        'signcerts'
    )
)

const tlsCertPath: string = envOrDefault(
    'TLS_CERT_PATH',
    path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt')
)

const peerEndpoint: string = envOrDefault('PEER_ENDPOINT', 'localhost:7051')
const peerHostAlias: string = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.example.com')

const utf8Decoder = new TextDecoder()
const assetId: string = `asset${Date.now()}`

export async function getContract() {
    const client = await newGrpcConnection()

    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        hash: hash.sha256,
        evaluateOptions: () => ({deadline: Date.now() + 5000}),
        endorseOptions: () => ({deadline: Date.now() + 15000}),
        submitOptions: () => ({deadline: Date.now() + 5000}),
        commitStatusOptions: () => ({deadline: Date.now() + 60000}),
    })

    const network = gateway.getNetwork(channelName)
    const contract: Contract = network.getContract(chaincodeName)
    return contract;
}
//
//
// async function main(): Promise<void> {
//     displayInputParameters()
//
//     const client = await newGrpcConnection()
//
//     const gateway = connect({
//         client,
//         identity: await newIdentity(),
//         signer: await newSigner(),
//         hash: hash.sha256,
//         evaluateOptions: () => ({deadline: Date.now() + 5000}),
//         endorseOptions: () => ({deadline: Date.now() + 15000}),
//         submitOptions: () => ({deadline: Date.now() + 5000}),
//         commitStatusOptions: () => ({deadline: Date.now() + 60000}),
//     })
//
//     try {
//         const network = gateway.getNetwork(channelName)
//         const contract: Contract = network.getContract(chaincodeName)
//
//         await initLedger(contract)
//         await getAllAssets(contract)
//         await createAsset(contract)
//         await transferAssetAsync(contract)
//         await readAssetByID(contract)
//         await updateNonExistentAsset(contract)
//     } finally {
//         gateway.close()
//         client.close()
//     }
// }
//
// main().catch((error: unknown) => {
//     console.error('******** FAILED to run the application:', error)
//     process.exitCode = 1
// })

async function newGrpcConnection(): Promise<grpc.Client> {
    const tlsRootCert = await fs.readFile(tlsCertPath)
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert)

    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    })
}

async function newIdentity(): Promise<{ mspId: string; credentials: Buffer }> {
    const certPath = await getFirstDirFileName(certDirectoryPath)
    const credentials = await fs.readFile(certPath) as Buffer
    return {mspId, credentials}
}

async function getFirstDirFileName(dirPath: string): Promise<string> {
    const files = await fs.readdir(dirPath)
    const file = files[0]
    if (!file) {
        throw new Error(`No files in directory: ${dirPath}`)
    }
    return path.join(dirPath, file)
}

async function newSigner() {
    const keyPath = await getFirstDirFileName(keyDirectoryPath)
    const privateKeyPem = await fs.readFile(keyPath) as Buffer
    const privateKey = crypto.createPrivateKey(privateKeyPem)
    return signers.newPrivateKeySigner(privateKey)
}

async function initLedger(contract: Contract): Promise<void> {
    console.log('\n--> Submit Transaction: InitLedger')
    await contract.submitTransaction('InitLedger')
    console.log('*** Transaction committed successfully')
}

async function getAllAssets(contract: Contract): Promise<void> {
    console.log('\n--> Evaluate Transaction: GetAllAssets')

    const resultBytes = await contract.evaluateTransaction('GetAllAssets')
    const result = JSON.parse(utf8Decoder.decode(resultBytes))

    console.log('*** Result:', result)
}

async function createAsset(contract: Contract): Promise<void> {
    console.log('\n--> Submit Transaction: CreateAsset')

    await contract.submitTransaction(
        'CreateAsset',
        assetId,
        'yellow',
        '5',
        'Tom',
        '1300'
    )

    console.log('*** Transaction committed successfully')
}

async function transferAssetAsync(contract: Contract): Promise<void> {
    console.log('\n--> Async Submit Transaction: TransferAsset')

    const commit = await contract.submitAsync('TransferAsset', {
        arguments: [assetId, 'Saptha'],
    })

    const oldOwner = utf8Decoder.decode(commit.getResult())

    console.log(
        `*** Successfully submitted transaction to transfer ownership from ${oldOwner} to Saptha`
    )

    const status = await commit.getStatus()
    if (!status.successful) {
        throw new Error(
            `Transaction ${status.transactionId} failed with status code ${status.code}`
        )
    }

    console.log('*** Transaction committed successfully')
}

async function readAssetByID(contract: Contract): Promise<void> {
    console.log('\n--> Evaluate Transaction: ReadAsset')

    const resultBytes = await contract.evaluateTransaction(
        'ReadAsset',
        assetId
    )

    const result = JSON.parse(utf8Decoder.decode(resultBytes))
    console.log('*** Result:', result)
}

async function updateNonExistentAsset(contract: Contract): Promise<void> {
    console.log('\n--> Submit Transaction: UpdateAsset (non-existent)')

    try {
        await contract.submitTransaction(
            'UpdateAsset',
            'asset70',
            'blue',
            '5',
            'Tomoko',
            '300'
        )
        console.log('******** FAILED to return an error')
    } catch (error) {
        console.log('*** Successfully caught the error:\n', error)
    }
}

function envOrDefault(key: string, defaultValue: string): string {
    return process.env[key] ?? defaultValue
}

function displayInputParameters(): void {
    console.log(`channelName:       ${channelName}`)
    console.log(`chaincodeName:     ${chaincodeName}`)
    console.log(`mspId:             ${mspId}`)
    console.log(`cryptoPath:        ${cryptoPath}`)
    console.log(`keyDirectoryPath:  ${keyDirectoryPath}`)
    console.log(`certDirectoryPath: ${certDirectoryPath}`)
    console.log(`tlsCertPath:       ${tlsCertPath}`)
    console.log(`peerEndpoint:      ${peerEndpoint}`)
    console.log(`peerHostAlias:     ${peerHostAlias}`)
}
