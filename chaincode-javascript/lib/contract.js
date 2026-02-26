'use strict';

const { Contract } = require('fabric-contract-api');
const BATCH_STATUS = Object.freeze({
    CREATED: 'CREATED',
    WAITING_FOR_TRANSPORT: 'WAITING_FOR_TRANSPORT',
    IN_TRANSPORT: 'IN_TRANSPORT',
    DELIVERED_TO_SLAUGHTERHOUSE: 'DELIVERED_TO_SLAUGHTERHOUSE',
    SLAUGHTERING: 'SLAUGHTERING',
    PROCESSED: 'PROCESSED',
    REJECTED: 'REJECTED',
    RECALLED: 'RECALLED'
});

const UNIT_STATUS = Object.freeze({
    CREATED: 'CREATED',
    WAITING_FOR_FROZEN_TRANSPORT: 'WAITING_FOR_FROZEN_TRANSPORT',
    IN_FROZEN_TRANSPORT: 'IN_FROZEN_TRANSPORT',
    DELIVERED_TO_RETAIL: 'DELIVERED_TO_RETAIL',
    ON_SALE: 'ON_SALE',
    SOLD: 'SOLD',
    REJECTED: 'REJECTED',
    RECALLED: 'RECALLED',
    DESTROYED: 'DESTROYED'
});

class HalalTraceabilityContract extends Contract {

    _batchKey(ctx, id) {
        return ctx.stub.createCompositeKey('Batch', [id.toString()]);
    }

    _processedKey(ctx, id) {
        return ctx.stub.createCompositeKey('ProcessedBatch', [id.toString()]);
    }

    _traceKey(ctx, batchId, unitId, datetime) {
        return ctx.stub.createCompositeKey('Trace', [
            batchId.toString(),
            unitId ? unitId.toString() : '0',
            datetime
        ]);
    }

    _unitStatusKey(ctx, batchId, unitId) {
        return ctx.stub.createCompositeKey('BatchUnit', [
            batchId.toString(),
            unitId.toString()
        ]);
    }

    async _getState(ctx, key) {
        const data = await ctx.stub.getState(key);
        if (!data || data.length === 0) {
            return null;
        }
        return JSON.parse(data.toString());
    }

    async _putState(ctx, key, value) {
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(value)));
    }

    async _addTrace(ctx, batchId, unitId, actorId, action, extra) {
        const datetime = new Date().toISOString();
        const trace = {
            batch_id: batchId,
            unit_id: unitId || 0,
            datetime,
            actor_id: actorId,
            action,
            extra_info: extra || {}
        };
        const key = this._traceKey(ctx, batchId, unitId, datetime);
        await this._putState(ctx, key, trace);
    }

    _assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    // ============================================================
    // ORGANIZATION ENTITIES
    // ============================================================

    async createFarmer(ctx, id, name, address, extra_info) {
        const key = ctx.stub.createCompositeKey('Farmer', [id.toString()]);
        const exists = await ctx.stub.getState(key);
        this._assert(!exists || exists.length === 0, 'Farmer exists');

        const obj = { id: +id, name, address, extra_info: JSON.parse(extra_info || '{}') };
        await this._putState(ctx, key, obj);
        return obj;
    }

    async getFarmerById(ctx, id) {
        return this._getState(ctx, ctx.stub.createCompositeKey('Farmer', [id.toString()]));
    }

    async getAllFarmers(ctx) {
        return this._getByPartial(ctx, 'Farmer');
    }

    async createSlaughteringHouse(ctx, id, name, address, extra_info) {
        const key = ctx.stub.createCompositeKey('Slaughterhouse', [id.toString()]);
        const obj = { id: +id, name, address, extra_info: JSON.parse(extra_info || '{}') };
        await this._putState(ctx, key, obj);
        return obj;
    }

    async getSlaughterHouseById(ctx, id) {
        return this._getState(ctx, ctx.stub.createCompositeKey('Slaughterhouse', [id.toString()]));
    }

    async getAllSlaughterHouses(ctx) {
        return this._getByPartial(ctx, 'Slaughterhouse');
    }

    async createRetailShop(ctx, id, name, address, extra_info) {
        const key = ctx.stub.createCompositeKey('RetailShop', [id.toString()]);
        const obj = { id: +id, name, address, extra_info: JSON.parse(extra_info || '{}') };
        await this._putState(ctx, key, obj);
        return obj;
    }

    async getRetailShopById(ctx, id) {
        return this._getState(ctx, ctx.stub.createCompositeKey('RetailShop', [id.toString()]));
    }

    async getAllRetailShops(ctx) {
        return this._getByPartial(ctx, 'RetailShop');
    }

    // ============================================================
    // BATCH (PRE-SLAUGHTER)
    // ============================================================

    async createPoultryBatch(ctx, id, farm_id, add_date, age_of_chicken, breed_type, ideal_temperature, extra_info) {
        const key = this._batchKey(ctx, id);
        const exists = await ctx.stub.getState(key);
        this._assert(!exists || exists.length === 0, 'Batch exists');

        const batch = {
            id: +id,
            farm_id: +farm_id,
            slaughter_house_id: null,
            status: BATCH_STATUS.CREATED,
            created_at: add_date,
            number_of_chicken: 0,
            age_of_chicken: +age_of_chicken,
            breed_type,
            ideal_temperature: +ideal_temperature,
            number_of_processed_units: 0,
            extra_info: JSON.parse(extra_info || '{}')
        };

        await this._putState(ctx, key, batch);
        return batch;
    }

    async getBatchById(ctx, id) {
        return this._getState(ctx, this._batchKey(ctx, id));
    }

    async getBatchesByStatus(ctx, status) {
        const all = await this._getByPartial(ctx, 'Batch');
        return all.filter(b => b.status === status);
    }

    async getBatchesByFarm(ctx, farm_id) {
        const all = await this._getByPartial(ctx, 'Batch');
        return all.filter(b => b.farm_id === +farm_id);
    }

    async dispatchBatchToTransport(ctx, batch_id, dispatch_time, number_of_chicken, room_temperature, dispatch_date, extra_info) {
        const batch = await this.getBatchById(ctx, batch_id);
        this._assert(batch.status === BATCH_STATUS.CREATED, 'Invalid state');

        batch.status = BATCH_STATUS.WAITING_FOR_TRANSPORT;
        batch.number_of_chicken = +number_of_chicken;

        await this._putState(ctx, this._batchKey(ctx, batch_id), batch);
        await this._addTrace(ctx, batch_id, null, 0, 'dispatch_to_transport', JSON.parse(extra_info || '{}'));
    }

    async acceptBatchForTransport(ctx, batch_id, acceptance_time, number_of_chicken, extra_info) {
        const batch = await this.getBatchById(ctx, batch_id);
        this._assert(batch.status === BATCH_STATUS.WAITING_FOR_TRANSPORT, 'Invalid state');

        batch.status = BATCH_STATUS.IN_TRANSPORT;
        await this._putState(ctx, this._batchKey(ctx, batch_id), batch);

        await this._addTrace(ctx, batch_id, null, 0, 'accepted_for_transport', JSON.parse(extra_info || '{}'));
    }

    async deliverBatch(ctx, batch_id, slaughter_house_id, delivery_time, number_of_chicken, extra_info) {
        const batch = await this.getBatchById(ctx, batch_id);
        this._assert(batch.status === BATCH_STATUS.IN_TRANSPORT, 'Invalid state');

        batch.status = BATCH_STATUS.DELIVERED_TO_SLAUGHTERHOUSE;
        batch.slaughter_house_id = +slaughter_house_id;

        await this._putState(ctx, this._batchKey(ctx, batch_id), batch);
        await this._addTrace(ctx, batch_id, null, 0, 'delivered_to_slaughterhouse', JSON.parse(extra_info || '{}'));
    }

    async acceptBatchForSlaughtering(ctx, batch_id, slaughter_house_id, acceptance_time, number_of_chicken, extra_info) {
        const batch = await this.getBatchById(ctx, batch_id);
        this._assert(batch.status === BATCH_STATUS.DELIVERED_TO_SLAUGHTERHOUSE, 'Invalid state');

        batch.status = BATCH_STATUS.SLAUGHTERING;
        await this._putState(ctx, this._batchKey(ctx, batch_id), batch);

        await this._addTrace(ctx, batch_id, null, 0, 'accepted_for_slaughter', JSON.parse(extra_info || '{}'));
    }

    // ============================================================
    // PROCESSING
    // ============================================================

    async createProcessedBatch(ctx, batch_id, number_of_split_batches, extra_info) {
        const batch = await this.getBatchById(ctx, batch_id);
        this._assert(batch.status === BATCH_STATUS.SLAUGHTERING, 'Invalid state');

        const count = +number_of_split_batches;
        this._assert(count > 0, 'Invalid split count');

        const units = [];

        for (let i = 1; i <= count; i++) {
            const unitId = parseInt(batch_id.toString() + i.toString().padStart(3, '0'));

            const unit = {
                original_batch_id: +batch_id,
                unit_id: unitId,
                status: UNIT_STATUS.CREATED,
                created_at: new Date().toISOString(),
                weight: 0,
                extra_info: JSON.parse(extra_info || '{}')
            };

            await this._putState(ctx, this._processedKey(ctx, unitId), unit);
            units.push(unit);
        }

        batch.status = BATCH_STATUS.PROCESSED;
        batch.number_of_processed_units = count;

        await this._putState(ctx, this._batchKey(ctx, batch_id), batch);
        return units;
    }

    async getProcessedBatchById(ctx, id) {
        return this._getState(ctx, this._processedKey(ctx, id));
    }

    async getProcessedBatchesByBatch(ctx, batch_id) {
        const all = await this._getByPartial(ctx, 'ProcessedBatch');
        return all.filter(p => p.original_batch_id === +batch_id);
    }

    async getProcessedBatchesByStatus(ctx, status) {
        const all = await this._getByPartial(ctx, 'ProcessedBatch');
        return all.filter(p => p.status === status);
    }

    // ============================================================
    // GLOBAL TRANSITIONS
    // ============================================================

    async rejectBatch(ctx, batch_id, reason, actor_id) {
        const batch = await this.getBatchById(ctx, batch_id);
        if (batch) {
            batch.status = BATCH_STATUS.REJECTED;
            await this._putState(ctx, this._batchKey(ctx, batch_id), batch);
            await this._addTrace(ctx, batch_id, null, actor_id, 'rejected', { reason });
            return;
        }
        throw new Error('Batch not found');
    }

    async recallBatch(ctx, batch_id, reason, authority_id) {
        const batch = await this.getBatchById(ctx, batch_id);
        this._assert(batch.status !== BATCH_STATUS.PROCESSED, 'Cannot recall processed batch directly');

        batch.status = BATCH_STATUS.RECALLED;
        await this._putState(ctx, this._batchKey(ctx, batch_id), batch);
        await this._addTrace(ctx, batch_id, null, authority_id, 'recalled', { reason });
    }

    // ============================================================
    // TRACE
    // ============================================================

    async queryTraceOfBatch(ctx, batch_id) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('Trace', [batch_id.toString()]);
        return this._collect(iterator);
    }

    async getTransportLog(ctx, unit_id) {
        return this._getState(ctx, ctx.stub.createCompositeKey('TransportLog', [unit_id.toString()]));
    }

    // ============================================================
    // HELPERS
    // ============================================================

    async _getByPartial(ctx, objectType) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey(objectType, []);
        return this._collect(iterator);
    }

    async _collect(iterator) {
        const results = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                results.push(JSON.parse(res.value.value.toString('utf8')));
            }
            if (res.done) {
                await iterator.close();
                return results;
            }
        }
    }
}

module.exports = HalalTraceabilityContract;
