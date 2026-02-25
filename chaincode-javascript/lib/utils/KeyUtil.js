class KeyUtil {

    static farmer(ctx, id) {
        return ctx.stub.createCompositeKey('farmer', [id]);
    }

    static batch(ctx, id) {
        return ctx.stub.createCompositeKey('batch', [id]);
    }

    static transport(ctx, batchId, id) {
        return ctx.stub.createCompositeKey('transport', [batchId, id]);
    }

    static slaughter(ctx, batchId, id) {
        return ctx.stub.createCompositeKey('slaughter', [batchId, id]);
    }

    static retail(ctx, batchId, id) {
        return ctx.stub.createCompositeKey('retail', [batchId, id]);
    }

    static iot(ctx, batchId, timestamp) {
        return ctx.stub.createCompositeKey('iot', [batchId, timestamp]);
    }
}

module.exports = KeyUtil;
