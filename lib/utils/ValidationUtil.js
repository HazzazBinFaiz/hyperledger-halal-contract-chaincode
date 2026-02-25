class ValidationUtil {
    static required(data, fields) {
        for (const f of fields) {
            if (!data[f]) throw new Error(`${f} is required`)
        }
    }
}
module.exports = ValidationUtil
