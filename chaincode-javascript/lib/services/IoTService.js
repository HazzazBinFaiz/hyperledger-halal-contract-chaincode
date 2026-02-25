const StateUtil = require('../utils/StateUtil')
const ValidationUtil = require('../utils/ValidationUtil')
const KeyUtil = require('../utils/KeyUtil')

class IoTService {

    static async record(ctx, data) {

        ValidationUtil.required(data,
            ['batchId','timestamp','temperature','humidity'])

        const key = KeyUtil.iot(ctx, data.batchId, data.timestamp)

        await StateUtil.put(ctx, key, {
            docType: 'iot',
            ...data
        })

        ctx.stub.setEvent('IoTRecorded', Buffer.from(JSON.stringify(data)))
        return data
    }
}

module.exports = IoTService
