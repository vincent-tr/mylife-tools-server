'use strict';

const { URL } = require('url');
const { MongoClient, ObjectID } = require('mongodb');

const { createLogger } = require('./logging');
const { getConfig } = require('./config');

const logger = createLogger('mylife:tools:server:database');

exports.dbObjects = {
  ObjectID
};

let current;

// http://mongodb.github.io/node-mongodb-native/3.2/
// https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html

exports.Database = class Database {
  async init({ url = getConfig('mongo')} = {}) {
    if(current) {
      throw new Error('There is already a database instance initialized');
    }

    const mongoLogger = {
      debug: (...args) => logger.debug(...args),
      log: (...args) => logger.info(...args),
      error: (...args) => logger.error(...args)
    };

    const options = {
      logger: mongoLogger,
      useNewUrlParser: true
    };

    this._client = await MongoClient.connect(url, options);

    const dbName = new URL(url).pathname.substring(1);
    this._db = this._client.db(dbName);

    logger.info(`Connected to ${url} (database=${dbName})`);
    current = this;
  }

  async terminate() {
    current = null;
    await this._client.close();
    this._client = null;
    this._db = null;
    logger.info('Close database');
  }

  collection(name) {
    return this._db.collection(name);
  }
};

exports.getDatabaseCollection = name => {
  if(!current) {
    throw new Error('getDatabaseCollection called without initialization');
  }
  return current.collection(name);
};
