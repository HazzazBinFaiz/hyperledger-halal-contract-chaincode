const StateUtil = require('../utils/StateUtil')
const ValidationUtil = require('../utils/ValidationUtil')
const KeyUtil = require('../utils/KeyUtil')

class FarmerService {

    static async create(ctx, data) {

        ValidationUtil.required(data, ['farmerId','name','location','createdAt'])

        const key = KeyUtil.farmer(ctx, data.farmerId)

        if (await StateUtil.exists(ctx, key))
            throw new Error('Farmer already exists')

        await StateUtil.put(ctx, key, {
            docType: 'farmer',
            ...data
        })

        ctx.stub.setEvent('FarmerCreated', Buffer.from(JSON.stringify(data)))
        return data
    }
}

module.exports = FarmerService
