'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const HalalTraceabilityContract = require('../lib/contract');

chai.use(chaiAsPromised);
const { expect } = chai;

function createMockContext() {
    const state = new Map();
    let tsCounter = 0;

    const createCompositeKey = (type, parts) => `${type}:${parts.join(':')}`;

    const stub = {
        createCompositeKey,

        async getState(key) {
            return state.has(key) ? Buffer.from(state.get(key)) : Buffer.from('');
        },

        async putState(key, value) {
            state.set(key, value.toString());
        },

        async getStateByPartialCompositeKey(objectType, attributes) {
            const prefix = attributes.length
                ? `${objectType}:${attributes.join(':')}`
                : `${objectType}:`;

            const entries = [...state.entries()]
                .filter(([key]) => key.startsWith(prefix))
                .map(([, value]) => value);

            let index = 0;
            return {
                async next() {
                    if (index < entries.length) {
                        const value = entries[index++];
                        return { value: { value: Buffer.from(value) }, done: false };
                    }
                    return { done: true };
                },
                async close() {
                    return;
                }
            };
        },

        async getStateByPartialCompositeKeyWithPagination(objectType, attributes, pageSize, bookmark) {
            const iterator = await this.getStateByPartialCompositeKey(objectType, attributes);
            return {
                iterator,
                metadata: {
                    bookmark: bookmark || '',
                    fetched_records_count: pageSize
                }
            };
        },

        getDateTimestamp() {
            tsCounter += 1;
            return new Date(Date.UTC(2026, 0, 1, 0, 0, tsCounter));
        }
    };

    return { ctx: { stub }, state };
}

async function seedEntity(ctx, type, id, value) {
    const key = ctx.stub.createCompositeKey(type, [id.toString()]);
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(value)));
}

describe('HalalTraceabilityContract', () => {
    let contract;
    let ctx;
    let state;

    beforeEach(() => {
        contract = new HalalTraceabilityContract();
        const setup = createMockContext();
        ctx = setup.ctx;
        state = setup.state;
    });

    it('covers utility helpers', async () => {
        expect(contract._batchKey(ctx, 7)).to.equal('Batch:7');
        expect(contract._processedKey(ctx, '7:10')).to.equal('ProcessedBatch:7:10');
        expect(contract._traceKey(ctx, 7, null, 't')).to.equal('Trace:7:0:t');
        expect(contract._unitStatusKey(ctx, 7, 1)).to.equal('BatchUnit:7:1');

        await contract._putState(ctx, 'X:1', { a: 1 });
        const parsed = await contract._getState(ctx, 'X:1');
        expect(parsed).to.deep.equal({ a: 1 });

        const missing = await contract._getState(ctx, 'X:2');
        expect(missing).to.equal(null);

        const originalGetState = ctx.stub.getState;
        ctx.stub.getState = async () => undefined;
        const missingByUndefined = await contract._getState(ctx, 'X:3');
        expect(missingByUndefined).to.equal(null);
        ctx.stub.getState = originalGetState;

        await contract._addTrace(ctx, 7, null, 1, 'TRACE_CODE', 'Manual trace without extra', 'BATCH');
        const traceList = await contract.queryTraceOfBatch(ctx, 7);
        expect(traceList[0].extra_info).to.deep.equal({});
        expect(traceList[0].action_code).to.equal('TRACE_CODE');
        expect(traceList[0].action_tag).to.equal('BATCH');

        expect(() => contract._assert(true, 'nope')).to.not.throw();
        expect(() => contract._assert(false, 'boom')).to.throw('boom');
    });

    it('creates and queries all actor types', async () => {
        const farmer = await contract.createFarmer(ctx, 1, 'F1', 'A1', '{"note":"n"}');
        expect(farmer.id).to.equal(1);

        await expect(contract.createFarmer(ctx, 1, 'F1', 'A1', '{}')).to.be.rejectedWith('Farmer exists');

        await contract.createSlaughteringHouse(ctx, 10, 'S1', 'SA', '{}');
        await contract.createRetailShop(ctx, 20, 'R1', 'RA', '{}');

        const farmerById = await contract.getFarmerById(ctx, 1);
        const slaughterById = await contract.getSlaughterHouseById(ctx, 10);
        const retailById = await contract.getRetailShopById(ctx, 20);

        expect(farmerById.name).to.equal('F1');
        expect(slaughterById.name).to.equal('S1');
        expect(retailById.name).to.equal('R1');

        const allFarmers = await contract.getAllFarmers(ctx);
        const allSlaughter = await contract.getAllSlaughterHouses(ctx);
        const allRetail = await contract.getAllRetailShops(ctx);

        expect(allFarmers).to.have.length(1);
        expect(allSlaughter).to.have.length(1);
        expect(allRetail).to.have.length(1);
    });

    it('runs complete batch lifecycle including iot and queries', async () => {
        const batch = await contract.createPoultryBatch(ctx, 100, 1, '2026-01-01T10:00:00Z', 35, 'Broiler', 22, '{"origin":"farm-a"}');
        expect(batch.status).to.equal('CREATED');

        const batchById = await contract.getBatchById(ctx, 100);
        expect(batchById.id).to.equal(100);

        let byStatus = await contract.getBatchesByStatus(ctx, 'CREATED');
        expect(byStatus).to.have.length(1);
        let byFarm = await contract.getBatchesByFarm(ctx, 1);
        expect(byFarm).to.have.length(1);

        await contract.dispatchBatchToTransport(ctx, 100, '2026-01-01T11:00:00Z', 500, 24, '{"truck":"T1"}');
        await contract.acceptBatchForTransport(ctx, 100, '2026-01-01T11:30:00Z', 500, '{}');
        await contract.addIoTTraceForBatch(ctx, 100, '90.41', '23.81', '4.2', '{"sensor":"s1"}');
        await contract.deliverBatch(ctx, 100, 9, '2026-01-01T13:00:00Z', 499, '{}');
        await contract.acceptBatchForSlaughtering(ctx, 100, '9', '2026-01-01T14:00:00Z', 499, '{}');
        const units = await contract.createProcessedBatch(ctx, 100, 2, '2026-01-02T00:00:00Z', '{"lot":"L1"}');

        expect(units).to.have.length(2);
        expect(units[0].unit_id).to.equal('100:1');

        byStatus = await contract.getBatchesByStatus(ctx, 'PROCESSED');
        expect(byStatus).to.have.length(1);

        const traces = await contract.queryTraceOfBatch(ctx, 100);
        expect(traces.length).to.be.greaterThan(6);

        const allBatches = await contract.getAllBatches(ctx);
        const allProcessed = await contract.getAllProcessedBatches(ctx);
        expect(allBatches).to.have.length(1);
        expect(allProcessed).to.have.length(2);
    });

    it('runs complete processed unit lifecycle including iot', async () => {
        const unit = {
            original_batch_id: 100,
            unit_id: '100:1',
            status: 'CREATED',
            created_at: '2026-01-01T00:00:00Z',
            weight: 0,
            extra_info: {}
        };

        await seedEntity(ctx, 'ProcessedBatch', '100:1', unit);

        await contract.dispatchProcessedBatchToFrozenTransport(ctx, '100:1', '2026-01-01T15:00:00Z', 2, '{}');
        await contract.acceptProcessedBatchForFrozenTransport(ctx, '100:1', '2026-01-01T16:00:00Z', '{}');
        await contract.addIoTTraceForProcessedBatch(ctx, '100:1', '91.2', '24.3', '-8.5', '{"sensor":"cold-2"}');
        await contract.deliverProcessedBatchToRetail(ctx, '100:1', 55, '2026-01-01T17:00:00Z', '{}');
        await contract.putProcessedBatchOnSale(ctx, '100:1', '2026-01-01T18:00:00Z', '{}');
        await contract.sellProcessedBatch(ctx, '100:1', '2026-01-01T19:00:00Z', '{}');

        const soldUnit = await contract.getProcessedBatchById(ctx, '100:1');
        expect(soldUnit.status).to.equal('SOLD');
        expect(soldUnit.retail_shop_id).to.equal(55);
    });

    it('rejects processed unit when sold and allows reject before sold', async () => {
        await seedEntity(ctx, 'ProcessedBatch', '200:1', {
            original_batch_id: 200,
            unit_id: '200:1',
            status: 'ON_SALE',
            created_at: '2026-01-01T00:00:00Z',
            weight: 0,
            extra_info: {}
        });

        await contract.rejectProcessedBatch(ctx, '200:1', 'Package damaged', 7);
        const rejected = await contract.getProcessedBatchById(ctx, '200:1');
        expect(rejected.status).to.equal('REJECTED');

        await seedEntity(ctx, 'ProcessedBatch', '200:2', {
            original_batch_id: 200,
            unit_id: '200:2',
            status: 'SOLD',
            created_at: '2026-01-01T00:00:00Z',
            weight: 0,
            extra_info: {}
        });

        await expect(contract.rejectProcessedBatch(ctx, '200:2', 'Late reject', 7))
            .to.be.rejectedWith('Cannot reject sold unit');
    });

    it('rejects batch and validates not-found branch', async () => {
        await seedEntity(ctx, 'Batch', 300, {
            id: 300,
            farm_id: 1,
            slaughter_house_id: null,
            status: 'CREATED',
            created_at: '2026-01-01T00:00:00Z',
            number_of_chicken: 0,
            age_of_chicken: 30,
            breed_type: 'Broiler',
            ideal_temperature: 22,
            number_of_processed_units: 0,
            extra_info: {}
        });

        await contract.rejectBatch(ctx, 300, 'Contamination', 99);
        const rejectedBatch = await contract.getBatchById(ctx, 300);
        expect(rejectedBatch.status).to.equal('REJECTED');

        await expect(contract.rejectBatch(ctx, 301, 'Unknown', 99)).to.be.rejectedWith('Batch not found');
    });

    it('covers invalid-state and not-found branches across transitions', async () => {
        await seedEntity(ctx, 'Batch', 400, {
            id: 400,
            farm_id: 1,
            slaughter_house_id: null,
            status: 'WAITING_FOR_TRANSPORT',
            created_at: 't',
            number_of_chicken: 0,
            age_of_chicken: 1,
            breed_type: 'X',
            ideal_temperature: 1,
            number_of_processed_units: 0,
            extra_info: {}
        });

        await expect(contract.dispatchBatchToTransport(ctx, 400, 't', 1, 1, '{}'))
            .to.be.rejectedWith('Invalid state');

        await seedEntity(ctx, 'Batch', 401, { ...JSON.parse(JSON.stringify({
            id: 401,
            farm_id: 1,
            slaughter_house_id: null,
            status: 'CREATED',
            created_at: 't',
            number_of_chicken: 0,
            age_of_chicken: 1,
            breed_type: 'X',
            ideal_temperature: 1,
            number_of_processed_units: 0,
            extra_info: {}
        })) });

        await expect(contract.acceptBatchForTransport(ctx, 401, 't', 1, '{}'))
            .to.be.rejectedWith('Invalid state');

        await expect(contract.deliverBatch(ctx, 401, 1, 't', 1, '{}'))
            .to.be.rejectedWith('Invalid state');

        await expect(contract.addIoTTraceForBatch(ctx, 401, '1', '1', '1', '{}'))
            .to.be.rejectedWith('Batch must be in transport');

        await expect(contract.addIoTTraceForBatch(ctx, 999, '1', '1', '1', '{}'))
            .to.be.rejectedWith('Batch not found');

        await seedEntity(ctx, 'Batch', 402, {
            id: 402,
            farm_id: 1,
            slaughter_house_id: 10,
            status: 'DELIVERED_TO_SLAUGHTERHOUSE',
            created_at: 't',
            number_of_chicken: 0,
            age_of_chicken: 1,
            breed_type: 'X',
            ideal_temperature: 1,
            number_of_processed_units: 0,
            extra_info: {}
        });

        await expect(contract.acceptBatchForSlaughtering(ctx, 402, '9', 't', 1, '{}'))
            .to.be.rejectedWith('Slaughter house invalid');

        await seedEntity(ctx, 'Batch', 403, {
            id: 403,
            farm_id: 1,
            slaughter_house_id: null,
            status: 'CREATED',
            created_at: 't',
            number_of_chicken: 0,
            age_of_chicken: 1,
            breed_type: 'X',
            ideal_temperature: 1,
            number_of_processed_units: 0,
            extra_info: {}
        });

        await expect(contract.createProcessedBatch(ctx, 403, 1, '2026-01-02T00:00:00Z', '{}')).to.be.rejectedWith('Invalid state');

        await seedEntity(ctx, 'Batch', 404, {
            id: 404,
            farm_id: 1,
            slaughter_house_id: 11,
            status: 'SLAUGHTERING',
            created_at: 't',
            number_of_chicken: 0,
            age_of_chicken: 1,
            breed_type: 'X',
            ideal_temperature: 1,
            number_of_processed_units: 0,
            extra_info: {}
        });

        await expect(contract.createProcessedBatch(ctx, 404, 0, '2026-01-02T00:00:00Z', '{}')).to.be.rejectedWith('Invalid split count');

        await expect(contract.dispatchProcessedBatchToFrozenTransport(ctx, '900:1', 't', 1, '{}'))
            .to.be.rejectedWith('Processed batch not found');

        await seedEntity(ctx, 'ProcessedBatch', '500:1', {
            original_batch_id: 500,
            unit_id: '500:1',
            status: 'WAITING_FOR_FROZEN_TRANSPORT',
            created_at: 't',
            weight: 0,
            extra_info: {}
        });

        await expect(contract.dispatchProcessedBatchToFrozenTransport(ctx, '500:1', 't', 1, '{}'))
            .to.be.rejectedWith('Invalid state');

        await seedEntity(ctx, 'ProcessedBatch', '500:2', {
            original_batch_id: 500,
            unit_id: '500:2',
            status: 'CREATED',
            created_at: 't',
            weight: 0,
            extra_info: {}
        });

        await expect(contract.acceptProcessedBatchForFrozenTransport(ctx, '500:2', 't', '{}'))
            .to.be.rejectedWith('Invalid state');

        await expect(contract.addIoTTraceForProcessedBatch(ctx, '500:2', '1', '1', '1', '{}'))
            .to.be.rejectedWith('Processed batch must be in frozen transport');

        await expect(contract.addIoTTraceForProcessedBatch(ctx, '900:2', '1', '1', '1', '{}'))
            .to.be.rejectedWith('Processed batch not found');

        await expect(contract.deliverProcessedBatchToRetail(ctx, '500:2', 1, 't', '{}'))
            .to.be.rejectedWith('Invalid state');

        await expect(contract.putProcessedBatchOnSale(ctx, '500:2', 't', '{}'))
            .to.be.rejectedWith('Invalid state');

        await expect(contract.sellProcessedBatch(ctx, '500:2', 't', '{}'))
            .to.be.rejectedWith('Invalid state');

        await expect(contract.rejectProcessedBatch(ctx, '900:3', 'nope', 1))
            .to.be.rejectedWith('Processed batch not found');
    });

    it('covers _collect empty-value branch', async () => {
        let calls = 0;
        const iterator = {
            async next() {
                calls += 1;
                if (calls === 1) {
                    return { value: { value: Buffer.from('') }, done: false };
                }
                return { done: true };
            },
            async close() {
                return;
            }
        };

        const res = await contract._collect(iterator);
        expect(res).to.deep.equal([]);
    });

    it('covers all extra_info fallback branches with undefined input', async () => {
        await contract.createFarmer(ctx, 901, 'F', 'A');
        await contract.createSlaughteringHouse(ctx, 902, 'S', 'A');
        await contract.createRetailShop(ctx, 903, 'R', 'A');

        await contract.createPoultryBatch(ctx, 910, 1, '2026-01-01T00:00:00Z', 10, 'Broiler', 21);
        await contract.dispatchBatchToTransport(ctx, 910, 't1', 100, 20);
        await contract.acceptBatchForTransport(ctx, 910, 't2', 100);
        await contract.addIoTTraceForBatch(ctx, 910, '1.1', '2.2', '3.3');
        await contract.deliverBatch(ctx, 910, 9, 't3', 99);
        await contract.acceptBatchForSlaughtering(ctx, 910, '9', 't4', 99);
        await contract.createProcessedBatch(ctx, 910, 1, '2026-01-03T00:00:00Z');

        await contract.dispatchProcessedBatchToFrozenTransport(ctx, '910:1', 't5', 5);
        await contract.acceptProcessedBatchForFrozenTransport(ctx, '910:1', 't6');
        await contract.addIoTTraceForProcessedBatch(ctx, '910:1', '1.3', '2.4', '-3.5');
        await contract.deliverProcessedBatchToRetail(ctx, '910:1', 15, 't7');
        await contract.putProcessedBatchOnSale(ctx, '910:1', 't8');
        await contract.sellProcessedBatch(ctx, '910:1', 't9');

        const traces = await contract.queryTraceOfBatch(ctx, 910);
        expect(traces.length).to.be.greaterThan(0);
    });

    it('covers paginated trace query helper', async () => {
        await contract.createPoultryBatch(ctx, 1000, 1, '2026-01-01T00:00:00Z', 10, 'Broiler', 21, '{}');
        const paginated = await contract.queryTraceOfBatchPaginated(ctx, 1000, 5, 'bookmark-1');
        expect(paginated.records).to.have.length(1);
        expect(paginated.bookmark).to.equal('bookmark-1');
        expect(paginated.fetched_records_count).to.equal(5);
    });

    it('covers paginated defaults and collectPaginated metadata fallback branches', async () => {
        await contract.createPoultryBatch(ctx, 1001, 1, '2026-01-01T00:00:00Z', 10, 'Broiler', 21, '{}');
        const paginatedDefault = await contract.queryTraceOfBatchPaginated(ctx, 1001);
        expect(paginatedDefault.records).to.have.length(1);
        expect(paginatedDefault.bookmark).to.equal('');
        expect(paginatedDefault.fetched_records_count).to.equal(20);

        const iterator = {
            async next() {
                return { done: true };
            },
            async close() {
                return;
            }
        };

        const fallback = await contract._collectPaginated(iterator);
        expect(fallback.bookmark).to.equal('');
        expect(fallback.fetched_records_count).to.equal(0);
    });

    it('validates expiration date when splitting processed batch', async () => {
        await seedEntity(ctx, 'Batch', 1100, {
            id: 1100,
            farm_id: 1,
            slaughter_house_id: 10,
            status: 'SLAUGHTERING',
            created_at: '2026-01-01T00:00:00Z',
            number_of_chicken: 0,
            age_of_chicken: 1,
            breed_type: 'X',
            ideal_temperature: 1,
            number_of_processed_units: 0,
            extra_info: {}
        });

        await expect(contract.createProcessedBatch(ctx, 1100, 1, 'invalid-date', '{}'))
            .to.be.rejectedWith('Invalid expiration date');

        await expect(contract.createProcessedBatch(ctx, 1100, 1, '2025-01-01T00:00:00Z', '{}'))
            .to.be.rejectedWith('Expiration date must be in the future');
    });

    it('returns only notifiable processed batches near expiry window', async () => {
        await seedEntity(ctx, 'ProcessedBatch', '1200:1', {
            original_batch_id: 1200,
            unit_id: '1200:1',
            status: 'DELIVERED_TO_RETAIL',
            created_at: '2026-01-01T00:00:00Z',
            expiration_date: '2026-01-01T12:00:00Z',
            weight: 0,
            extra_info: {}
        });

        await seedEntity(ctx, 'ProcessedBatch', '1200:2', {
            original_batch_id: 1200,
            unit_id: '1200:2',
            status: 'ON_SALE',
            created_at: '2026-01-01T00:00:00Z',
            expiration_date: '2026-01-02T12:00:00Z',
            weight: 0,
            extra_info: {}
        });

        await seedEntity(ctx, 'ProcessedBatch', '1200:3', {
            original_batch_id: 1200,
            unit_id: '1200:3',
            status: 'SOLD',
            created_at: '2026-01-01T00:00:00Z',
            expiration_date: '2026-01-01T08:00:00Z',
            weight: 0,
            extra_info: {}
        });

        const notifiable = await contract.getNotifiableProcessedBatches(ctx, 720); // 12 hours
        expect(notifiable).to.have.length(1);
        expect(notifiable[0].unit_id).to.equal('1200:1');
        expect(notifiable[0]).to.have.property('notify_at');
    });
});
