'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class ReadGetBatchByIdWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.readIndex = 0;
        this.batchIds = [];
        this.errorCount = 0;
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        this.contractId = roundArguments.contractId || 'halal_contract';
        const seedCount = Number(roundArguments.seedCount || 500);

        for (let i = 0; i < seedCount; i += 1) {
            const batchId = `${workerIndex}${roundIndex}${Date.now()}${i}`.slice(-18);
            this.batchIds.push(batchId);

            await this.sutAdapter.sendRequests({
                contractId: this.contractId,
                contractFunction: 'createPoultryBatch',
                contractArguments: [
                    batchId,
                    '1',
                    new Date().toISOString(),
                    '45',
                    'Broiler',
                    '4',
                    '{"seed":true}'
                ],
                readOnly: false
            });
        }
    }

    async submitTransaction() {
        this.readIndex += 1;
        const index = this.readIndex % this.batchIds.length;
        const batchId = this.batchIds[index];

        try {
            await this.sutAdapter.sendRequests({
                contractId: this.contractId,
                contractFunction: 'getBatchById',
                contractArguments: [batchId],
                readOnly: true
            });
        } catch (error) {
            this.errorCount += 1;
            if (this.errorCount % 50 === 1) {
                console.warn(`[read-get-batch-by-id] transient query error count=${this.errorCount}: ${error.message}`);
            }
        }
    }
}

function createWorkloadModule() {
    return new ReadGetBatchByIdWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
