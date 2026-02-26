'use strict';

const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { Context } = require('fabric-contract-api');

const HalalTraceabilityContract = require('../lib/contract');

chai.should();
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('HalalTraceabilityContract', () => {

    let sandbox;
    let contract;
    let ctx;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        contract = new HalalTraceabilityContract();

        ctx = sinon.createStubInstance(Context);
        ctx.stub = {
            createCompositeKey: sinon.stub().callsFake((type, parts) => `${type}:${parts.join(':')}`),
            getState: sinon.stub(),
            putState: sinon.stub().resolves(),
            getStateByPartialCompositeKey: sinon.stub()
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    /* ---------------------------------------------------------- */
    /* ---------------------- createFarmer ---------------------- */
    /* ---------------------------------------------------------- */

    describe('#createFarmer', () => {

        it('should create farmer if not exists', async () => {

            ctx.stub.getState.resolves(Buffer.from(''));

            const result = await contract.createFarmer(
                ctx,
                1,
                'John',
                'Dhaka',
                '{}'
            );

            sinon.assert.calledOnce(ctx.stub.putState);
            expect(result.name).to.equal('John');
        });

        it('should throw if farmer exists', async () => {

            ctx.stub.getState.resolves(Buffer.from('exists'));

            await expect(
                contract.createFarmer(ctx, 1, 'John', 'Dhaka', '{}')
            ).to.be.rejectedWith('Farmer exists');
        });

    });

    /* ---------------------------------------------------------- */
    /* ------------------- createPoultryBatch ------------------- */
    /* ---------------------------------------------------------- */

    describe('#createPoultryBatch', () => {

        it('should create batch with CREATED status', async () => {

            ctx.stub.getState.resolves(Buffer.from(''));

            const batch = await contract.createPoultryBatch(
                ctx,
                100,
                1,
                new Date().toISOString(),
                30,
                'Broiler',
                22,
                '{}'
            );

            expect(batch.status).to.equal('CREATED');
            sinon.assert.calledOnce(ctx.stub.putState);
        });

    });

    /* ---------------------------------------------------------- */
    /* ---------------- dispatchBatchToTransport ---------------- */
    /* ---------------------------------------------------------- */

    describe('#dispatchBatchToTransport', () => {

        it('should change status CREATED → WAITING_FOR_TRANSPORT', async () => {

            const batch = {
                id: 100,
                status: 'CREATED'
            };

            ctx.stub.getState.resolves(Buffer.from(JSON.stringify(batch)));

            await contract.dispatchBatchToTransport(
                ctx,
                100,
                new Date().toISOString(),
                500,
                25,
                new Date().toISOString(),
                '{}'
            );

            sinon.assert.called(ctx.stub.putState);
        });

        it('should reject invalid state', async () => {

            const batch = { id: 100, status: 'IN_TRANSPORT' };
            ctx.stub.getState.resolves(Buffer.from(JSON.stringify(batch)));

            await expect(
                contract.dispatchBatchToTransport(
                    ctx, 100, '', 0, 0, '', '{}'
                )
            ).to.be.rejectedWith('Invalid state');
        });

    });

    /* ---------------------------------------------------------- */
    /* ---------------- createProcessedBatch -------------------- */
    /* ---------------------------------------------------------- */

    describe('#createProcessedBatch', () => {

        it('should split batch into units and mark PROCESSED', async () => {

            const batch = {
                id: 200,
                status: 'SLAUGHTERING'
            };

            ctx.stub.getState.resolves(Buffer.from(JSON.stringify(batch)));

            const units = await contract.createProcessedBatch(
                ctx,
                200,
                2,
                '{}'
            );

            expect(units.length).to.equal(2);
            sinon.assert.called(ctx.stub.putState);
        });

        it('should reject if batch not in SLAUGHTERING', async () => {

            const batch = {
                id: 200,
                status: 'CREATED'
            };

            ctx.stub.getState.resolves(Buffer.from(JSON.stringify(batch)));

            await expect(
                contract.createProcessedBatch(ctx, 200, 2, '{}')
            ).to.be.rejectedWith('Invalid state');
        });

    });

    /* ---------------------------------------------------------- */
    /* ---------------------- rejectBatch ----------------------- */
    /* ---------------------------------------------------------- */

    describe('#rejectBatch', () => {

        it('should mark batch REJECTED', async () => {

            const batch = { id: 300, status: 'CREATED' };

            ctx.stub.getState.resolves(Buffer.from(JSON.stringify(batch)));

            await contract.rejectBatch(ctx, 300, 'Health issue', 1);

            sinon.assert.called(ctx.stub.putState);
        });

    });

});
