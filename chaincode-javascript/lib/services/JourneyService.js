class JourneyService {

    static async get(ctx, batchId) {

        const timeline = [];

        const collect = async (type) => {
            const iterator = await ctx.stub.getStateByPartialCompositeKey(type, [batchId]);
            while (true) {
                const res = await iterator.next();
                if (res.value)
                {timeline.push(JSON.parse(res.value.value.toString()));}
                if (res.done) {break;}
            }
        };

        await collect('transport');
        await collect('slaughter');
        await collect('retail');
        await collect('iot');

        timeline.sort((a,b) =>
            (a.timestamp || a.receivedAt)
                .localeCompare(b.timestamp || b.receivedAt)
        );

        return timeline;
    }
}

module.exports = JourneyService;
