'use strict';

const { MongoClient, ObjectID } = require('mongodb');

const { createLogger } = require('./logging');
const { getConfig } = require('./config');

const log = createLogger('mylife:tools:server:database');

exports.dbObjects = {
  ObjectID
};

let db;

// http://mongodb.github.io/node-mongodb-native/3.2/
// https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
exports.initDatabase = async function({ url = getConfig('mongo')} = {}) {
  const mongoLogger = {
    debug: (...args) => log.debug(...args),
    log: (...args) => log.info(...args),
    error: (...args) => log.error(...args)
  };

  const options = {
    logger: mongoLogger,
  };

  db = await MongoClient.connect(url, options);
};

exports.getDatabaseCollection = name => {
  if(!db) {
    throw new Error('getDatabaseCollection called without initialization');
  }
  db.collection(name);
}
