'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class LatencyByFunctionWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txIndex = 0;
        this.pool = [];
        this.errorCount = 0;
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        this.workerIndex = workerIndex;
        this.contractId = roundArguments.contractId || 'halal_contract';
        this.targetFunction = roundArguments.targetFunction;
        this.seedCount = Number(roundArguments.seedCount || 300);

        const noSeedFunctions = new Set([
            'createFarmer',
            'createSlaughteringHouse',
            'createRetailShop',
            'createPoultryBatch'
        ]);

        if (!noSeedFunctions.has(this.targetFunction)) {
            await this.seedDataForTarget();
        }
    }

    makeBatchId(seedIndex) {
        const raw = `${Date.now()}${this.workerIndex}${this.roundIndex}${seedIndex}`;
        return raw.slice(-18);
    }

    async invokeCreate(batchId, extra) {
        await this._sendRequestSafe({
            contractId: this.contractId,
            contractFunction: 'createPoultryBatch',
            contractArguments: [
                batchId,
                '1',
                new Date().toISOString(),
                '45',
                'Broiler',
                '4',
                extra || '{"seed":true}'
            ],
            readOnly: false
        });
    }

    async _sendRequestSafe(request) {
        try {
            await this.sutAdapter.sendRequests(request);
        } catch (error) {
            this.errorCount += 1;
            if (this.errorCount % 50 === 1) {
                console.warn(`[latency-by-function] transient error count=${this.errorCount}: ${error.message}`);
            }
        }
    }

    async seedDataForTarget() {
        for (let i = 0; i < this.seedCount; i += 1) {
            const batchId = this.makeBatchId(i);
            await this.invokeCreate(batchId, '{"seed":"create"}');

            if (this.targetFunction === 'dispatchBatchToTransport') {
                this.pool.push(batchId);
                continue;
            }

            await this._sendRequestSafe({
                contractId: this.contractId,
                contractFunction: 'dispatchBatchToTransport',
                contractArguments: [
                    batchId,
                    new Date().toISOString(),
                    '100',
                    '8',
                    '{"seed":"dispatch"}'
                ],
                readOnly: false
            });

            if (this.targetFunction === 'acceptBatchForTransport') {
                this.pool.push(batchId);
                continue;
            }

            await this._sendRequestSafe({
                contractId: this.contractId,
                contractFunction: 'acceptBatchForTransport',
                contractArguments: [
                    batchId,
                    new Date().toISOString(),
                    '100',
                    '{"seed":"accept"}'
                ],
                readOnly: false
            });

            if (this.targetFunction === 'deliverBatch') {
                this.pool.push(batchId);
                continue;
            }

            await this._sendRequestSafe({
                contractId: this.contractId,
                contractFunction: 'deliverBatch',
                contractArguments: [
                    batchId,
                    '1',
                    new Date().toISOString(),
                    '100',
                    '{"seed":"deliver"}'
                ],
                readOnly: false
            });

            if (this.targetFunction === 'createProcessedBatch') {
                await this._sendRequestSafe({
                    contractId: this.contractId,
                    contractFunction: 'acceptBatchForSlaughtering',
                    contractArguments: [
                        batchId,
                        '1',
                        new Date().toISOString(),
                        '100',
                        '{"seed":"slaughter-accept"}'
                    ],
                    readOnly: false
                });
                this.pool.push(batchId);
            }
        }
    }

    async submitTransaction() {
        this.txIndex += 1;
        const idx = this.pool.length > 0 ? this.txIndex % this.pool.length : this.txIndex;
        const batchId = this.pool.length > 0 ? this.pool[idx] : this.makeBatchId(this.txIndex);

        if (this.targetFunction === 'createFarmer') {
            const id = this.makeBatchId(this.txIndex);
            await this._sendRequestSafe({
                contractId: this.contractId,
                contractFunction: 'createFarmer',
                contractArguments: [
                    id,
                    `Farmer ${id}`,
                    'Dhaka',
                    '{"run":"latency"}'
                ],
                readOnly: false
            });
            return;
        }

        if (this.targetFunction === 'createSlaughteringHouse') {
            const id = this.makeBatchId(this.txIndex);
            await this._sendRequestSafe({
                contractId: this.contractId,
                contractFunction: 'createSlaughteringHouse',
                contractArguments: [
                    id,
                    `Slaughter ${id}`,
                    'Gazipur',
                    '{"run":"latency"}'
                ],
                readOnly: false
            });
            return;
        }

        if (this.targetFunction === 'createRetailShop') {
            const id = this.makeBatchId(this.txIndex);
            await this._sendRequestSafe({
                contractId: this.contractId,
                contractFunction: 'createRetailShop',
                contractArguments: [
                    id,
                    `Retail ${id}`,
                    'Dhaka',
                    '{"run":"latency"}'
                ],
                readOnly: false
            });
            return;
        }

        if (this.targetFunction === 'createPoultryBatch') {
            await this.invokeCreate(batchId, '{"run":"latency"}');
            return;
        }

        if (this.targetFunction === 'dispatchBatchToTransport') {
            await this._sendRequestSafe({
                contractId: this.contractId,
                contractFunction: 'dispatchBatchToTransport',
                contractArguments: [
                    batchId,
                    new Date().toISOString(),
                    '100',
                    '8',
                    '{"run":"latency"}'
                ],
                readOnly: false
            });
            return;
        }

        if (this.targetFunction === 'acceptBatchForTransport') {
            await this._sendRequestSafe({
                contractId: this.contractId,
                contractFunction: 'acceptBatchForTransport',
                contractArguments: [
                    batchId,
                    new Date().toISOString(),
                    '100',
                    '{"run":"latency"}'
                ],
                readOnly: false
            });
            return;
        }

        if (this.targetFunction === 'deliverBatch') {
            await this._sendRequestSafe({
                contractId: this.contractId,
                contractFunction: 'deliverBatch',
                contractArguments: [
                    batchId,
                    '1',
                    new Date().toISOString(),
                    '100',
                    '{"run":"latency"}'
                ],
                readOnly: false
            });
            return;
        }

        if (this.targetFunction === 'createProcessedBatch') {
            await this._sendRequestSafe({
                contractId: this.contractId,
                contractFunction: 'createProcessedBatch',
                contractArguments: [
                    batchId,
                    '4',
                    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    '{"run":"latency"}'
                ],
                readOnly: false
            });
            return;
        }

        throw new Error(`Unsupported targetFunction: ${this.targetFunction}`);
    }
}

function createWorkloadModule() {
    return new LatencyByFunctionWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
