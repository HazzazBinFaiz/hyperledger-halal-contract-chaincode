'use strict';

const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { Context } = require('fabric-contract-api');

const PoultryContract = require('../lib/PoultryContract');

const FarmerService = require('../lib/services/FarmerService');
const BatchService = require('../lib/services/BatchService');
const TransportService = require('../lib/services/TransportService');
const IoTService = require('../lib/services/IoTService');
const JourneyService = require('../lib/services/JourneyService');

chai.should();
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('PoultryContract', () => {

    let sandbox;
    let contract;
    let ctx;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        contract = new PoultryContract();
        ctx = sinon.createStubInstance(Context);
    });

    afterEach(() => {
        sandbox.restore();
    });

    /* ---------------------------------------------------------- */
    /* ---------------------- createFarmer ---------------------- */
    /* ---------------------------------------------------------- */

    describe('#createFarmer', () => {

        it('should parse JSON and call FarmerService.create', async () => {
            const payload = { id: 'F1', name: 'John' };

            const serviceStub = sandbox.stub(FarmerService, 'create')
                .resolves(true);

            const result = await contract.createFarmer(ctx, JSON.stringify(payload));

            sinon.assert.calledWith(serviceStub, ctx, payload);
            expect(result).to.equal(true);
        });

        it('should throw if JSON invalid', async () => {
            await expect(
                contract.createFarmer(ctx, 'invalid-json')
            ).to.be.rejected;
        });

    });

    /* ---------------------------------------------------------- */
    /* ---------------------- createBatch ------------------------ */
    /* ---------------------------------------------------------- */

    describe('#createBatch', () => {

        it('should delegate to BatchService.create', async () => {
            const payload = { id: 'B1', farmerId: 'F1' };

            const stub = sandbox.stub(BatchService, 'create')
                .resolves(true);

            const result = await contract.createBatch(ctx, JSON.stringify(payload));

            sinon.assert.calledWith(stub, ctx, payload);
            expect(result).to.equal(true);
        });

    });

    /* ---------------------------------------------------------- */
    /* --------------------- createTransport --------------------- */
    /* ---------------------------------------------------------- */

    describe('#createTransport', () => {

        it('should delegate to TransportService.create', async () => {
            const payload = { id: 'T1', batchId: 'B1' };

            const stub = sandbox.stub(TransportService, 'create')
                .resolves(true);

            const result = await contract.createTransport(ctx, JSON.stringify(payload));

            sinon.assert.calledWith(stub, ctx, payload);
            expect(result).to.equal(true);
        });

    });

    /* ---------------------------------------------------------- */
    /* ------------------------ recordIoT ------------------------ */
    /* ---------------------------------------------------------- */

    describe('#recordIoT', () => {

        it('should delegate to IoTService.record', async () => {
            const payload = { batchId: 'B1', temperature: 4 };

            const stub = sandbox.stub(IoTService, 'record')
                .resolves(true);

            const result = await contract.recordIoT(ctx, JSON.stringify(payload));

            sinon.assert.calledWith(stub, ctx, payload);
            expect(result).to.equal(true);
        });

    });

    /* ---------------------------------------------------------- */
    /* ----------------------- queryJourney ---------------------- */
    /* ---------------------------------------------------------- */

    describe('#queryJourney', () => {

        it('should call JourneyService.get with batchId', async () => {
            const journey = { batchId: 'B1', timeline: [] };

            const stub = sandbox.stub(JourneyService, 'get')
                .resolves(journey);

            const result = await contract.queryJourney(ctx, 'B1');

            sinon.assert.calledWith(stub, ctx, 'B1');
            expect(result).to.deep.equal(journey);
        });

    });

});
