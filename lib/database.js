'use strict';

const { URL } = require('url');
const { MongoClient, ObjectID } = require('mongodb');

const { createLogger } = require('./logging');
const { getConfig } = require('./config');

const logger = createLogger('mylife:tools:server:database');

exports.dbObjects = {
  ObjectID
};

let db;

// http://mongodb.github.io/node-mongodb-native/3.2/
// https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
exports.initDatabase = async function({ url = getConfig('mongo')} = {}) {
  const mongoLogger = {
    debug: (...args) => logger.debug(...args),
    log: (...args) => logger.info(...args),
    error: (...args) => logger.error(...args)
  };

  const options = {
    logger: mongoLogger,
    useNewUrlParser: true
  };

  const client = await MongoClient.connect(url, options);

  const dbName = new URL(url).pathname.substring(1);
  db = client.db(dbName);
  
  logger.info(`Connected to ${url} (database=${dbName})`);
};

exports.getDatabaseCollection = name => {
  if(!db) {
    throw new Error('getDatabaseCollection called without initialization');
  }
  return db.collection(name);
}
