const { STATUS } = require('../constants')
const BatchService = require('./BatchService')
const StateUtil = require('../utils/StateUtil')
const ValidationUtil = require('../utils/ValidationUtil')
const KeyUtil = require('../utils/KeyUtil')

class TransportService {

    static async create(ctx, data) {

        ValidationUtil.required(data,
            ['transportId','batchId','type','from','to','timestamp'])

        const batchKey = KeyUtil.batch(ctx, data.batchId)
        if (!await StateUtil.exists(ctx, batchKey))
            throw new Error('Batch does not exist')

        const key = KeyUtil.transport(ctx, data.batchId, data.transportId)

        if (await StateUtil.exists(ctx, key))
            throw new Error('Transport exists')

        await StateUtil.put(ctx, key, {
            docType: 'transport',
            ...data
        })

        if (data.type === 'LIVE')
            await BatchService.transition(ctx, data.batchId, STATUS.LIVE_TRANSPORTED)

        if (data.type === 'COLD')
            await BatchService.transition(ctx, data.batchId, STATUS.COLD_TRANSPORTED)

        ctx.stub.setEvent('TransportCreated', Buffer.from(JSON.stringify(data)))
        return data
    }
}

module.exports = TransportService
