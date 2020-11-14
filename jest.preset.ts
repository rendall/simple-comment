const merge = require("merge")
const ts_preset = require("ts-jest/jest-preset")
const jest_mongodb_preset = require("@shelf/jest-mongodb/jest-preset")

module.exports = merge.recursive(ts_preset, jest_mongodb_preset)
