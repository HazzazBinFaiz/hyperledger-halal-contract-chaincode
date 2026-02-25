class StateUtil {

    static async put(ctx, key, value) {
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(value)));
    }

    static async get(ctx, key) {
        const data = await ctx.stub.getState(key);
        if (!data || data.length === 0) {return null;}
        return JSON.parse(data.toString());
    }

    static async exists(ctx, key) {
        const data = await ctx.stub.getState(key);
        return data && data.length > 0;
    }
}

module.exports = StateUtil;
