'use strict';

const { Contract } = require('fabric-contract-api');

const BATCH_STATUS = Object.freeze({
    CREATED: 'CREATED',
    WAITING_FOR_TRANSPORT: 'WAITING_FOR_TRANSPORT',
    IN_TRANSPORT: 'IN_TRANSPORT',
    DELIVERED_TO_SLAUGHTERHOUSE: 'DELIVERED_TO_SLAUGHTERHOUSE',
    SLAUGHTERING: 'SLAUGHTERING',
    PROCESSED: 'PROCESSED',
    REJECTED: 'REJECTED'
});

const UNIT_STATUS = Object.freeze({
    CREATED: 'CREATED',
    WAITING_FOR_FROZEN_TRANSPORT: 'WAITING_FOR_FROZEN_TRANSPORT',
    IN_FROZEN_TRANSPORT: 'IN_FROZEN_TRANSPORT',
    DELIVERED_TO_RETAIL: 'DELIVERED_TO_RETAIL',
    ON_SALE: 'ON_SALE',
    SOLD: 'SOLD',
    REJECTED: 'REJECTED'
});

const TRACE_TAG = Object.freeze({
    BATCH: 'BATCH',
    TRANSPORT: 'TRANSPORT',
    SLAUGHTER: 'SLAUGHTER',
    PROCESS: 'PROCESS',
    UNIT: 'UNIT',
    IOT: 'IOT',
    QUALITY: 'QUALITY',
    SALE: 'SALE'
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
        if (!data || data.length === 0) return null;
        return JSON.parse(data.toString());
    }

    async _putState(ctx, key, value) {
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(value)));
    }

    async _addTrace(ctx, batchId, unitId, actorId, actionCode, actionMessage, actionTag, extra) {
        const datetime = ctx.stub.getDateTimestamp().toISOString();
        const trace = {
            batch_id: batchId,
            unit_id: unitId || 0,
            datetime,
            actor_id: actorId,
            action_code: actionCode,
            action: actionMessage,
            action_message: actionMessage,
            action_tag: actionTag,
            extra_info: extra || {}
        };
        const key = this._traceKey(ctx, batchId, unitId, datetime);
        await this._putState(ctx, key, trace);
    }

    _assert(condition, message) {
        if (!condition) throw new Error(message);
    }

    _safeDate(value) {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return null;
        return parsed;
    }

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
        await this._addTrace(
            ctx,
            id,
            null,
            0,
            'BATCH_CREATED',
            `Batch ${id} created at farm ${farm_id}`,
            TRACE_TAG.BATCH,
            batch.extra_info
        );
        return batch;
    }

    async getBatchById(ctx, id) {
        return this._getState(ctx, this._batchKey(ctx, id));
    }

    async getAllBatches(ctx) {
        return this._getByPartial(ctx, 'Batch');
    }

    async getBatchesByStatus(ctx, status) {
        const all = await this._getByPartial(ctx, 'Batch');
        return all.filter(b => b.status === status);
    }

    async getBatchesByFarm(ctx, farm_id) {
        const all = await this._getByPartial(ctx, 'Batch');
        return all.filter(b => b.farm_id === +farm_id);
    }

    async dispatchBatchToTransport(ctx, batch_id, dispatch_time, number_of_chicken, room_temperature, extra_info) {
        const batch = await this.getBatchById(ctx, batch_id);
        this._assert(batch.status === BATCH_STATUS.CREATED, 'Invalid state');

        batch.status = BATCH_STATUS.WAITING_FOR_TRANSPORT;
        await this._putState(ctx, this._batchKey(ctx, batch_id), batch);

        await this._addTrace(
            ctx,
            batch_id,
            null,
            0,
            'BATCH_DISPATCHED',
            `Batch dispatched at ${dispatch_time} with ${number_of_chicken} chickens, temperature ${room_temperature}°C`,
            TRACE_TAG.TRANSPORT,
            JSON.parse(extra_info || '{}')
        );
    }

    async acceptBatchForTransport(ctx, batch_id, acceptance_time, number_of_chicken, extra_info) {
        const batch = await this.getBatchById(ctx, batch_id);
        this._assert(batch.status === BATCH_STATUS.WAITING_FOR_TRANSPORT, 'Invalid state');

        batch.status = BATCH_STATUS.IN_TRANSPORT;
        await this._putState(ctx, this._batchKey(ctx, batch_id), batch);

        await this._addTrace(
            ctx,
            batch_id,
            null,
            0,
            'BATCH_TRANSPORT_ACCEPTED',
            `Batch accepted for transport at ${acceptance_time} with ${number_of_chicken} chickens`,
            TRACE_TAG.TRANSPORT,
            JSON.parse(extra_info || '{}')
        );
    }

    async deliverBatch(ctx, batch_id, slaughter_house_id, delivery_time, number_of_chicken, extra_info) {
        const batch = await this.getBatchById(ctx, batch_id);
        this._assert(batch.status === BATCH_STATUS.IN_TRANSPORT, 'Invalid state');

        batch.status = BATCH_STATUS.DELIVERED_TO_SLAUGHTERHOUSE;
        batch.slaughter_house_id = +slaughter_house_id;

        await this._putState(ctx, this._batchKey(ctx, batch_id), batch);

        await this._addTrace(
            ctx,
            batch_id,
            null,
            0,
            'BATCH_DELIVERED_TO_SLAUGHTERHOUSE',
            `Batch delivered to slaughterhouse ${slaughter_house_id} at ${delivery_time} with ${number_of_chicken} chickens`,
            TRACE_TAG.TRANSPORT,
            JSON.parse(extra_info || '{}')
        );
    }

    async addIoTTraceForBatch(ctx, batch_id, longitude, latitude, temperature, extra_info) {
        const batch = await this.getBatchById(ctx, batch_id);
        this._assert(batch, 'Batch not found');
        this._assert(batch.status === BATCH_STATUS.IN_TRANSPORT, 'Batch must be in transport');

        const payload = {
            longitude: Number(longitude),
            latitude: Number(latitude),
            temperature: Number(temperature),
            ...JSON.parse(extra_info || '{}')
        };

        await this._addTrace(
            ctx,
            batch_id,
            null,
            0,
            'BATCH_IOT_CAPTURED',
            'IoT telemetry captured for batch transport',
            TRACE_TAG.IOT,
            payload
        );
    }

    async anchorIoTTraceForBatch(ctx, batch_id, payload_hash, extra_info) {
        const batch = await this.getBatchById(ctx, batch_id);
        this._assert(batch, 'Batch not found');
        this._assert(batch.status === BATCH_STATUS.IN_TRANSPORT, 'Batch must be in transport');
        this._assert(payload_hash && payload_hash.trim().length > 0, 'payload_hash is required');

        const payload = {
            payload_hash: payload_hash.trim(),
            storage: 'timescaledb',
            ...JSON.parse(extra_info || '{}')
        };

        await this._addTrace(
            ctx,
            batch_id,
            null,
            0,
            'BATCH_IOT_HASH_ANCHORED',
            'IoT telemetry hash anchored for batch transport',
            TRACE_TAG.IOT,
            payload
        );
    }

    async acceptBatchForSlaughtering(ctx, batch_id, slaughter_house_id, acceptance_time, number_of_chicken, extra_info) {
        const batch = await this.getBatchById(ctx, batch_id);
        this._assert(batch.status === BATCH_STATUS.DELIVERED_TO_SLAUGHTERHOUSE, 'Invalid state');

        batch.status = BATCH_STATUS.SLAUGHTERING;
        this._assert(batch.slaughter_house_id.toString() === slaughter_house_id, 'Slaughter house invalid')
        await this._putState(ctx, this._batchKey(ctx, batch_id), batch);

        await this._addTrace(
            ctx,
            batch_id,
            null,
            0,
            'BATCH_SLAUGHTER_ACCEPTED',
            `Batch accepted for slaughtering at slaughterhouse ${slaughter_house_id} on ${acceptance_time} with ${number_of_chicken} chickens`,
            TRACE_TAG.SLAUGHTER,
            JSON.parse(extra_info || '{}')
        );
    }

    async createProcessedBatch(ctx, batch_id, number_of_split_batches, expiration_date, extra_info) {
        const batch = await this.getBatchById(ctx, batch_id);
        this._assert(batch.status === BATCH_STATUS.SLAUGHTERING, 'Invalid state');

        const count = +number_of_split_batches;
        this._assert(count > 0, 'Invalid split count');
        const expiresAt = this._safeDate(expiration_date);
        this._assert(expiresAt, 'Invalid expiration date');
        const now = new Date(ctx.stub.getDateTimestamp().toISOString());
        this._assert(expiresAt.getTime() > now.getTime(), 'Expiration date must be in the future');

        const units = [];

        for (let i = 1; i <= count; i++) {
            const unitId = `${batch_id}:${i}`;

            const unit = {
                original_batch_id: +batch_id,
                unit_id: unitId,
                status: UNIT_STATUS.CREATED,
                created_at: ctx.stub.getDateTimestamp().toISOString(),
                expiration_date: expiresAt.toISOString(),
                weight: 0,
                extra_info: JSON.parse(extra_info || '{}')
            };

            await this._putState(ctx, this._processedKey(ctx, unitId), unit);
            units.push(unit);
        }

        batch.status = BATCH_STATUS.PROCESSED;
        batch.number_of_processed_units = count;
        await this._putState(ctx, this._batchKey(ctx, batch_id), batch);

        await this._addTrace(
            ctx,
            batch_id,
            null,
            0,
            'BATCH_PROCESSED',
            `Batch processed into ${count} units`,
            TRACE_TAG.PROCESS,
            JSON.parse(extra_info || '{}')
        );

        return units;
    }

    async getNotifiableProcessedBatches(ctx, warn_me_before_minutes) {
        const warnMinutes = parseInt(warn_me_before_minutes, 10);
        this._assert(Number.isInteger(warnMinutes) && warnMinutes > 0, 'Invalid warn window');

        const now = new Date(ctx.stub.getDateTimestamp().toISOString());
        const warnMs = warnMinutes * 60 * 1000;
        const all = await this.getAllProcessedBatches(ctx);

        return all
            .filter((unit) => {
                if (!unit) return false;
                if (unit.status !== UNIT_STATUS.DELIVERED_TO_RETAIL && unit.status !== UNIT_STATUS.ON_SALE) {
                    return false;
                }

                const expiresAt = this._safeDate(unit.expiration_date);
                if (!expiresAt) return false;
                if (expiresAt.getTime() <= now.getTime()) return false;

                const notifyAt = new Date(expiresAt.getTime() - warnMs);
                return now.getTime() >= notifyAt.getTime();
            })
            .map((unit) => {
                const expiresAt = new Date(unit.expiration_date);
                const notifyAt = new Date(expiresAt.getTime() - warnMs);

                return {
                    ...unit,
                    notify_at: notifyAt.toISOString()
                };
            });
    }

    async getProcessedBatchById(ctx, unit_id) {
        return this._getState(ctx, this._processedKey(ctx, unit_id));
    }

    async getAllProcessedBatches(ctx) {
        return this._getByPartial(ctx, 'ProcessedBatch');
    }

    async dispatchProcessedBatchToFrozenTransport(ctx, unit_id, dispatch_time, room_temperature, extra_info) {
        const unit = await this.getProcessedBatchById(ctx, unit_id);
        this._assert(unit, 'Processed batch not found');
        this._assert(unit.status === UNIT_STATUS.CREATED, 'Invalid state');

        unit.status = UNIT_STATUS.WAITING_FOR_FROZEN_TRANSPORT;
        await this._putState(ctx, this._processedKey(ctx, unit_id), unit);

        await this._addTrace(
            ctx,
            unit.original_batch_id,
            unit.unit_id,
            0,
            'UNIT_DISPATCHED_TO_FROZEN_TRANSPORT',
            `Processed unit dispatched at ${dispatch_time}, temperature ${room_temperature}°C`,
            TRACE_TAG.TRANSPORT,
            JSON.parse(extra_info || '{}')
        );
    }

    async acceptProcessedBatchForFrozenTransport(ctx, unit_id, acceptance_time, extra_info) {
        const unit = await this.getProcessedBatchById(ctx, unit_id);
        this._assert(unit, 'Processed batch not found');
        this._assert(unit.status === UNIT_STATUS.WAITING_FOR_FROZEN_TRANSPORT, 'Invalid state');

        unit.status = UNIT_STATUS.IN_FROZEN_TRANSPORT;
        await this._putState(ctx, this._processedKey(ctx, unit_id), unit);

        await this._addTrace(
            ctx,
            unit.original_batch_id,
            unit.unit_id,
            0,
            'UNIT_FROZEN_TRANSPORT_ACCEPTED',
            `Processed unit accepted for frozen transport at ${acceptance_time}`,
            TRACE_TAG.TRANSPORT,
            JSON.parse(extra_info || '{}')
        );
    }

    async addIoTTraceForProcessedBatch(ctx, unit_id, longitude, latitude, temperature, extra_info) {
        const unit = await this.getProcessedBatchById(ctx, unit_id);
        this._assert(unit, 'Processed batch not found');
        this._assert(unit.status === UNIT_STATUS.IN_FROZEN_TRANSPORT, 'Processed batch must be in frozen transport');

        const payload = {
            longitude: Number(longitude),
            latitude: Number(latitude),
            temperature: Number(temperature),
            ...JSON.parse(extra_info || '{}')
        };

        await this._addTrace(
            ctx,
            unit.original_batch_id,
            unit.unit_id,
            0,
            'UNIT_IOT_CAPTURED',
            'IoT telemetry captured for frozen transport',
            TRACE_TAG.IOT,
            payload
        );
    }

    async anchorIoTTraceForProcessedBatch(ctx, unit_id, payload_hash, extra_info) {
        const unit = await this.getProcessedBatchById(ctx, unit_id);
        this._assert(unit, 'Processed batch not found');
        this._assert(unit.status === UNIT_STATUS.IN_FROZEN_TRANSPORT, 'Processed batch must be in frozen transport');
        this._assert(payload_hash && payload_hash.trim().length > 0, 'payload_hash is required');

        const payload = {
            payload_hash: payload_hash.trim(),
            storage: 'timescaledb',
            ...JSON.parse(extra_info || '{}')
        };

        await this._addTrace(
            ctx,
            unit.original_batch_id,
            unit.unit_id,
            0,
            'UNIT_IOT_HASH_ANCHORED',
            'IoT telemetry hash anchored for frozen transport',
            TRACE_TAG.IOT,
            payload
        );
    }

    async deliverProcessedBatchToRetail(ctx, unit_id, retail_shop_id, delivery_time, extra_info) {
        const unit = await this.getProcessedBatchById(ctx, unit_id);
        this._assert(unit, 'Processed batch not found');
        this._assert(unit.status === UNIT_STATUS.IN_FROZEN_TRANSPORT, 'Invalid state');

        unit.status = UNIT_STATUS.DELIVERED_TO_RETAIL;
        unit.retail_shop_id = +retail_shop_id;
        await this._putState(ctx, this._processedKey(ctx, unit_id), unit);

        await this._addTrace(
            ctx,
            unit.original_batch_id,
            unit.unit_id,
            0,
            'UNIT_DELIVERED_TO_RETAIL',
            `Processed unit delivered to retail shop ${retail_shop_id} at ${delivery_time}`,
            TRACE_TAG.UNIT,
            JSON.parse(extra_info || '{}')
        );
    }

    async putProcessedBatchOnSale(ctx, unit_id, sale_time, extra_info) {
        const unit = await this.getProcessedBatchById(ctx, unit_id);
        this._assert(unit, 'Processed batch not found');
        this._assert(unit.status === UNIT_STATUS.DELIVERED_TO_RETAIL, 'Invalid state');

        unit.status = UNIT_STATUS.ON_SALE;
        await this._putState(ctx, this._processedKey(ctx, unit_id), unit);

        await this._addTrace(
            ctx,
            unit.original_batch_id,
            unit.unit_id,
            0,
            'UNIT_PUT_ON_SALE',
            `Processed unit put on sale at ${sale_time}`,
            TRACE_TAG.SALE,
            JSON.parse(extra_info || '{}')
        );
    }

    async sellProcessedBatch(ctx, unit_id, sold_time, extra_info) {
        const unit = await this.getProcessedBatchById(ctx, unit_id);
        this._assert(unit, 'Processed batch not found');
        this._assert(unit.status === UNIT_STATUS.ON_SALE, 'Invalid state');

        unit.status = UNIT_STATUS.SOLD;
        await this._putState(ctx, this._processedKey(ctx, unit_id), unit);

        await this._addTrace(
            ctx,
            unit.original_batch_id,
            unit.unit_id,
            0,
            'UNIT_SOLD',
            `Processed unit sold at ${sold_time}`,
            TRACE_TAG.SALE,
            JSON.parse(extra_info || '{}')
        );
    }

    async rejectProcessedBatch(ctx, unit_id, reason, actor_id) {
        const unit = await this.getProcessedBatchById(ctx, unit_id);
        this._assert(unit, 'Processed batch not found');
        this._assert(unit.status !== UNIT_STATUS.SOLD, 'Cannot reject sold unit');

        unit.status = UNIT_STATUS.REJECTED;
        await this._putState(ctx, this._processedKey(ctx, unit_id), unit);

        await this._addTrace(
            ctx,
            unit.original_batch_id,
            unit.unit_id,
            actor_id,
            'UNIT_REJECTED',
            `Processed unit rejected. Reason: ${reason}`,
            TRACE_TAG.QUALITY,
            { reason }
        );
    }

    async rejectBatch(ctx, batch_id, reason, actor_id) {
        const batch = await this.getBatchById(ctx, batch_id);
        this._assert(batch, 'Batch not found');

        batch.status = BATCH_STATUS.REJECTED;
        await this._putState(ctx, this._batchKey(ctx, batch_id), batch);

        await this._addTrace(
            ctx,
            batch_id,
            null,
            actor_id,
            'BATCH_REJECTED',
            `Batch rejected. Reason: ${reason}`,
            TRACE_TAG.QUALITY,
            { reason }
        );
    }

    async queryTraceOfBatch(ctx, batch_id) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey('Trace', [batch_id.toString()]);
        return this._collect(iterator);
    }

    async queryTraceOfBatchPaginated(ctx, batch_id, page_size, bookmark) {
        const pageSize = Math.max(1, parseInt(page_size || '20', 10));
        const queryBookmark = bookmark || '';
        const result = await ctx.stub.getStateByPartialCompositeKeyWithPagination(
            'Trace',
            [batch_id.toString()],
            pageSize,
            queryBookmark
        );
        return this._collectPaginated(result.iterator, result.metadata);
    }

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

    async _collectPaginated(iterator, metadata) {
        const records = await this._collect(iterator);
        return {
            records,
            bookmark: metadata && metadata.bookmark ? metadata.bookmark : '',
            fetched_records_count: metadata && metadata.fetched_records_count ? metadata.fetched_records_count : records.length
        };
    }
}

module.exports = HalalTraceabilityContract;
