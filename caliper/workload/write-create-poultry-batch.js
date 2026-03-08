'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class WriteCreatePoultryBatchWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txIndex = 0;
        this.workerPrefix = `w${this.workerIndex || 0}`;
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);
        this.workerPrefix = `w${workerIndex}`;
        this.contractId = roundArguments.contractId || 'halal_contract';
        this.farmId = String(roundArguments.farmId || 1);
        this.breedType = roundArguments.breedType || 'Broiler';
        this.idealTemp = String(roundArguments.idealTemp || 4);
    }

    async submitTransaction() {
        this.txIndex += 1;

        const batchId = `${Date.now()}${this.workerPrefix}${this.roundIndex}${this.txIndex}`.slice(-18);
        const request = {
            contractId: this.contractId,
            contractFunction: 'createPoultryBatch',
            contractArguments: [
                batchId,
                this.farmId,
                new Date().toISOString(),
                '45',
                this.breedType,
                this.idealTemp,
                '{"source":"caliper"}'
            ],
            readOnly: false
        };

        await this.sutAdapter.sendRequests(request);
    }
}

function createWorkloadModule() {
    return new WriteCreatePoultryBatchWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
