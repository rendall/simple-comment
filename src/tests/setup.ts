const path_m = require('path');
const fs_m = require('fs');
const {MongoMemoryServer} = require('mongodb-memory-server');
const globalConfigPath_m = path_m.join(__dirname, 'globalConfig.json');

const mongod = new MongoMemoryServer({
  autoStart: false,
});

module.exports = async () => {
  if (!mongod.getInstanceInfo()) {
    await mongod.start();
  }

  const mongoConfig = {
    mongoDBName: 'jest',
    mongoUri: await mongod.getConnectionString(),
  };

  // Write global config to disk because all tests run in different contexts.
  fs_m.writeFileSync(globalConfigPath_m, JSON.stringify(mongoConfig));

  // Set reference to mongod in order to close the server during teardown.
  global.__MONGOD__ = mongod;
};