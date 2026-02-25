const { Contract } = require('fabric-contract-api');

const FarmerService = require('./services/FarmerService');
const BatchService = require('./services/BatchService');
const TransportService = require('./services/TransportService');
const IoTService = require('./services/IoTService');
const JourneyService = require('./services/JourneyService');

class PoultryContract extends Contract {

    async createFarmer(ctx, data) {
        return FarmerService.create(ctx, JSON.parse(data));
    }

    async createBatch(ctx, data) {
        return BatchService.create(ctx, JSON.parse(data));
    }

    async createTransport(ctx, data) {
        return TransportService.create(ctx, JSON.parse(data));
    }

    async recordIoT(ctx, data) {
        return IoTService.record(ctx, JSON.parse(data));
    }

    async queryJourney(ctx, batchId) {
        return JourneyService.get(ctx, batchId);
    }
}

module.exports = PoultryContract;
