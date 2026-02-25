const { STATUS, ALLOWED_TRANSITIONS } = require('../constants')
const StateUtil = require('../utils/StateUtil')
const ValidationUtil = require('../utils/ValidationUtil')
const KeyUtil = require('../utils/KeyUtil')

class BatchService {

    static async create(ctx, data) {

        ValidationUtil.required(data,
            ['batchId','farmerId','quantity','hatchDate','createdAt'])

        const farmerKey = KeyUtil.farmer(ctx, data.farmerId)
        if (!await StateUtil.exists(ctx, farmerKey))
            throw new Error('Farmer does not exist')

        const key = KeyUtil.batch(ctx, data.batchId)
        if (await StateUtil.exists(ctx, key))
            throw new Error('Batch already exists')

        const batch = {
            docType: 'batch',
            ...data,
            status: STATUS.CREATED
        }

        await StateUtil.put(ctx, key, batch)
        ctx.stub.setEvent('BatchCreated', Buffer.from(JSON.stringify(batch)))
        return batch
    }

    static async transition(ctx, batchId, newStatus) {

        const key = KeyUtil.batch(ctx, batchId)
        const batch = await StateUtil.get(ctx, key)

        if (!batch) throw new Error('Batch not found')

        const allowed = ALLOWED_TRANSITIONS[batch.status]
        if (!allowed.includes(newStatus))
            throw new Error(`Invalid transition ${batch.status} -> ${newStatus}`)

        batch.status = newStatus
        await StateUtil.put(ctx, key, batch)

        ctx.stub.setEvent('BatchStatusUpdated', Buffer.from(JSON.stringify(batch)))
        return batch
    }
}

module.exports = BatchService
