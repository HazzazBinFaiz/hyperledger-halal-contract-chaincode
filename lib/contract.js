'use strict';

const { Contract } = require('fabric-contract-api');

const farmerPrefix = 'farmer';
const batchPrefix = 'poultryBatch';
const transportPrefix = 'transport';
const environmentPrefix = 'environmentStatus';

class HalalTrackerContract extends Contract {
    /**
     * Register Farmer
     * @param {Context} ctx
     * @param {Integer} farmerID
     * @param {String} farmer_name
     * @param {String} address
     * @param {String} farm_location
     */
    async registerFarmer(ctx, farmerID, farmer_name, address, farm_location) {

        const farmerKey = ctx.stub.createCompositeKey(farmerPrefix, [farmerID.toString()]);

        const existingFarmer = await ctx.stub.getState(farmerKey);
        if (existingFarmer && existingFarmer.length > 0) {
            throw new Error(`Farmer with ID ${farmerID} already exists`);
        }

        const farmer = {
            farmerID: parseInt(farmerID.toString()),
            farmer_name,
            address,
            farm_location,
            registeredBy: ctx.clientIdentity.getID(),
        };

        await ctx.stub.putState(farmerKey, Buffer.from(JSON.stringify(farmer)));

        return farmer;
    }

    /**
     * Add Poultry Batch
     * @param {Context} ctx
     * @param {Integer} batch_id
     * @param {String} add_date
     * @param {Integer} age_of_chicken
     * @param {String} breed_type
     * @param {Number} ideal_temperature
     */
    async addPoultryBatch(ctx, batch_id, add_date, age_of_chicken, breed_type, ideal_temperature) {

        const owner = ctx.clientIdentity.getID();
        const batchKey = ctx.stub.createCompositeKey(batchPrefix, [batch_id.toString()]);

        const existingBatch = await ctx.stub.getState(batchKey);
        if (existingBatch && existingBatch.length > 0) {
            throw new Error(`Batch with ID ${batch_id} already exists`);
        }

        if (parseInt(age_of_chicken.toString()) < 0) {
            throw new Error("Age of chicken must be 0 or positive");
        }

        const batch = {
            batch_id: parseInt(batch_id.toString()),
            owner,
            add_date,
            age_of_chicken: parseInt(age_of_chicken.toString()),
            breed_type,
            ideal_temperature: parseFloat(ideal_temperature.toString()),
            status: "CREATED",
        };

        await ctx.stub.putState(batchKey, Buffer.from(JSON.stringify(batch)));

        // Event: BatchCreated
        ctx.stub.setEvent("BatchCreated", Buffer.from(JSON.stringify(batch)));

        return batch;
    }

    /**
     * Dispatch Batch to Transport
     * @param {Context} ctx
     * @param {Integer} batch_id
     * @param {Integer} number_of_chicken_dispatched
     * @param {String} dispatch_date
     */
    async dispatchBatchToTransport(ctx, batch_id, number_of_chicken_dispatched, dispatch_date) {

        const caller = ctx.clientIdentity.getID();
        const batchKey = ctx.stub.createCompositeKey(batchPrefix, [batch_id.toString()]);

        const batchBytes = await ctx.stub.getState(batchKey);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Batch ${batch_id} does not exist`);
        }

        const batch = JSON.parse(batchBytes.toString());

        if (batch.owner !== caller) {
            throw new Error("Only the batch owner (farmer) can dispatch this batch");
        }

        if (batch.status === "DISPATCHED") {
            throw new Error("Batch already dispatched");
        }

        const dispatchedCount = parseInt(number_of_chicken_dispatched);
        if (dispatchedCount <= 0) {
            throw new Error("Dispatched chicken count must be positive");
        }

        batch.status = "DISPATCHED";
        batch.dispatch_info = {
            number_of_chicken_dispatched: dispatchedCount,
            dispatch_date
        };

        await ctx.stub.putState(batchKey, Buffer.from(JSON.stringify(batch)));

        // Event: BatchDispatched
        ctx.stub.setEvent("BatchDispatched", Buffer.from(JSON.stringify(batch)));

        return batch;
    }

    /**
     * Store Environmental Status (humidity sensor data etc.)
     * @param {Context} ctx
     * @param {Integer} batch_id
     * @param {String} humidity_sensor_data
     * @param {String} temperature_sensor_data
     */
    async environmentalStatus(ctx, batch_id, humidity_sensor_data, temperature_sensor_data) {

        const batchKey = ctx.stub.createCompositeKey(batchPrefix, [batch_id.toString()]);
        const batchBytes = await ctx.stub.getState(batchKey);

        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Batch ${batch_id} does not exist`);
        }

        const envKey = ctx.stub.createCompositeKey(environmentPrefix, [
            batch_id.toString(),
        ]);

        const environmentData = {
            batch_id: parseInt(batch_id),
            humidity_sensor_data,
            temperature_sensor_data,
            recordedBy: ctx.clientIdentity.getID()
        };

        await ctx.stub.putState(envKey, Buffer.from(JSON.stringify(environmentData)));

        return environmentData;
    }


    async acceptBatchForTransport(
        ctx,
        transport_id,
        batch_id,
        vehicle_number,
        driver_name,
        driver_contact,
        vehicle_type,
        acceptance_time
    ) {

        const transportKey = ctx.stub.createCompositeKey(transportPrefix, [transport_id.toString()]);
        const batchKey = ctx.stub.createCompositeKey(batchPrefix, [batch_id.toString()]);

        const existingTransport = await ctx.stub.getState(transportKey);
        if (existingTransport && existingTransport.length > 0) {
            throw new Error(`Transport ID ${transport_id} already exists`);
        }

        const batchBytes = await ctx.stub.getState(batchKey);
        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Batch ${batch_id} does not exist`);
        }

        const batch = JSON.parse(batchBytes.toString());

        if (batch.status !== "DISPATCHED") {
            throw new Error("Batch must be dispatched before transport can accept it");
        }

        const transport = {
            transport_id: parseInt(transport_id),
            batch_id: parseInt(batch_id),
            vehicle_number,
            driver_name,
            driver_contact,
            vehicle_type,
            acceptance_time: parseInt(acceptance_time),
            acceptedBy: ctx.clientIdentity.getID(),
            status: "ACCEPTED",
        };

        await ctx.stub.putState(transportKey, Buffer.from(JSON.stringify(transport)));

        return transport;
    }


    async startTransport(
        ctx,
        transport_id,
        batch_id,
        source_location,
        destination_location,
        start_timestamp
    ) {

        const transportKey = ctx.stub.createCompositeKey(transportPrefix, [transport_id.toString()]);
        const transportBytes = await ctx.stub.getState(transportKey);

        if (!transportBytes || transportBytes.length === 0) {
            throw new Error(`Transport ${transport_id} does not exist`);
        }

        const transport = JSON.parse(transportBytes.toString());

        if (transport.batch_id !== parseInt(batch_id)) {
            throw new Error("Batch ID mismatch for this transport record");
        }

        if (transport.status !== "ACCEPTED") {
            throw new Error("Transport must be ACCEPTED before starting");
        }

        transport.source_location = source_location;
        transport.destination_location = destination_location;
        transport.start_timestamp = parseInt(start_timestamp);
        transport.status = "IN_TRANSIT";

        await ctx.stub.putState(transportKey, Buffer.from(JSON.stringify(transport)));

        return transport;
    }

    /**
     * Deliver Batch
     */
    async deliverBatch(
        ctx,
        transport_id,
        batch_id,
        receiver_id,
        delivery_location,
        delivery_time,
        delivery_status
    ) {

        const transportKey = ctx.stub.createCompositeKey(transportPrefix, [transport_id.toString()]);
        const transportBytes = await ctx.stub.getState(transportKey);

        if (!transportBytes || transportBytes.length === 0) {
            throw new Error(`Transport ${transport_id} does not exist`);
        }

        const transport = JSON.parse(transportBytes.toString());

        if (transport.batch_id !== parseInt(batch_id)) {
            throw new Error("Batch ID mismatch for this transport record");
        }

        if (transport.status !== "IN_TRANSIT") {
            throw new Error("Transport must be IN_TRANSIT before delivery");
        }

        transport.receiver_id = parseInt(receiver_id);
        transport.delivery_location = delivery_location;
        transport.delivery_time = parseInt(delivery_time);
        transport.delivery_status = delivery_status;
        transport.status = "DELIVERED";

        await ctx.stub.putState(transportKey, Buffer.from(JSON.stringify(transport)));

        // Update Batch Status also
        const batchKey = ctx.stub.createCompositeKey(batchPrefix, [batch_id.toString()]);
        const batchBytes = await ctx.stub.getState(batchKey);

        if (batchBytes && batchBytes.length > 0) {
            const batch = JSON.parse(batchBytes.toString());
            batch.status = "DELIVERED";
            await ctx.stub.putState(batchKey, Buffer.from(JSON.stringify(batch)));
        }

        return transport;
    }

    async queryFarmer(ctx, farmerID) {
        const farmerKey = ctx.stub.createCompositeKey(farmerPrefix, [farmerID.toString()]);
        const farmerBytes = await ctx.stub.getState(farmerKey);

        if (!farmerBytes || farmerBytes.length === 0) {
            throw new Error(`Farmer ${farmerID} not found`);
        }

        return JSON.parse(farmerBytes.toString());
    }

    async queryBatch(ctx, batch_id) {
        const batchKey = ctx.stub.createCompositeKey(batchPrefix, [batch_id.toString()]);
        const batchBytes = await ctx.stub.getState(batchKey);

        if (!batchBytes || batchBytes.length === 0) {
            throw new Error(`Batch ${batch_id} not found`);
        }

        return JSON.parse(batchBytes.toString());
    }

    async queryTransport(ctx, transport_id) {
        const transportKey = ctx.stub.createCompositeKey(transportPrefix, [transport_id.toString()]);
        const transportBytes = await ctx.stub.getState(transportKey);

        if (!transportBytes || transportBytes.length === 0) {
            throw new Error(`Transport ${transport_id} not found`);
        }

        return JSON.parse(transportBytes.toString());
    }

    async queryEnvironmentalLogs(ctx, batch_id) {

        const iterator = await ctx.stub.getStateByPartialCompositeKey(environmentPrefix, [batch_id.toString()]);
        const results = [];

        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                const record = JSON.parse(res.value.value.toString());
                results.push(record);
            }

            if (res.done) {
                await iterator.close();
                break;
            }
        }

        return results;
    }
}

module.exports = HalalTrackerContract;
