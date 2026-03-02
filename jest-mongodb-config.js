module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      // Keep on MongoDB 6.x: jest-mongodb's default ephemeralForTest config
      // is not supported by MongoDB 7+.
      version: "6.0.14",
      skipMD5: true,
    },
    autoStart: false,
    instance: {},
  },
}
