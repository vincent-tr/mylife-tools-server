'use strict';

const { createLogger } = require('../logging');
const { getService } = require('../service-manager');

const logger = createLogger('mylife:tools:server:store');

const { Collection } = require('./collection');

// http://mongodb.github.io/node-mongodb-native/3.2/
// https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html

class Store {
  async init({ storeConfiguration }) {
    if(!storeConfiguration) {
      throw new Error('no store configuration');
    }
  }

  async terminate() {
  }
}

Store.serviceName = 'store';
Store.dependencies = ['metadata-manager', 'database'];
exports.Store = Store;

//exports.getDatabaseCollection = (name) => getService('database').collection(name);
