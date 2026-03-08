'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class ReadGetBatchByIdWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.readIndex = 0;
        this.batchIds = [];
        this.errorCount = 0;
        this.seedCompleted = false;
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        this.contractId = roundArguments.contractId || 'halal_contract';
        const seedCount = Number(roundArguments.seedCount || 0);

        // Seed only once per worker process to avoid long prepare time for every round.
        if (!this.seedCompleted && seedCount > 0) {
            for (let i = 0; i < seedCount; i += 1) {
                const batchId = `${workerIndex}${Date.now()}${i}`.slice(-18);
                this.batchIds.push(batchId);

                try {
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
                } catch (error) {
                    this.errorCount += 1;
                }
            }
            this.seedCompleted = true;
        }

        if (this.batchIds.length === 0) {
            for (let i = 0; i < 100; i += 1) {
                this.batchIds.push(`nonexistent-${workerIndex}-${i}`);
            }
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
