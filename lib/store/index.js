'use strict';

const { createLogger } = require('../logging');
const { getService } = require('../service-manager');

const logger = createLogger('mylife:tools:server:store');

const { Collection } = require('./collection');
const { deserializeObject, serializeObject, serializeObjectId } = require('./serializer');

async function loadCollection(collection) {
  logger.info(`loading database collection '${collection.name}' (entity='${collection.entity.id}', databaseCollection='${collection.databaseCollection.collectionName}')`);
  const cursor = collection.databaseCollection.find({});
  await cursor.forEach(record => {
    const object = deserializeObject(record, collection.entity);
    collection.set(object);
  });
}

function registerDatabaseUpdater(collection) {
  collection.on('change', event => {
    const taskQueue = getService('task-queue-manager').getQueue('store');
    taskQueue.add(`${collection.name}/${event.type}`, async () => {
      await databaseUpdate(collection, event);
    });
  });
}

async function databaseUpdate(collection, { before, after, type }) {
  switch(type) {
    case 'create': {
      const databaseCollection = collection.databaseCollection;
      const record = serializeObject(after, collection.entity);
      await databaseCollection.insertOne(record);
      break;
    }

    case 'update': {
      const databaseCollection = collection.databaseCollection;
      const record = serializeObject(after, collection.entity);
      await databaseCollection.replaceOne({ _id: record._id }, record);
      break;
    }

    case 'delete': {
      const databaseCollection = collection.databaseCollection;
      const id = serializeObjectId(before, collection.entity);
      await databaseCollection.deleteOne({ _id: id });
      break;
    }

    default:
      throw new Error(`Unsupported event type: '${type}'`);
  }
}

class Store {
  constructor() {
    this._collections = new Map();
  }

  async init({ storeConfiguration }) {
    if(!storeConfiguration) {
      throw new Error('no store configuration');
    }

    getService('task-queue-manager').createQueue('store');

    for(const collectionConfiguration of storeConfiguration) {
      const { collection: name, entity: entityId = name, database: databaseName = name, indexes } = collectionConfiguration;

      const entity = getService('metadata-manager').getEntity(entityId);
      const databaseCollection = getService('database').collection(databaseName);
      const collection = new Collection(name, databaseCollection, entity);
      this._collections.set(name, collection);

      await loadCollection(collection);

      for(const index of indexes) {
        collection.setupIndex(index);
      }

      registerDatabaseUpdater(collection);
    }
  }

  async terminate() {
    await getService('task-queue-manager').closeQueue('store');
  }

  collection(name) {
    const result = this._collections.get(name);
    if(result) {
      return result;
    }

    throw new Error(`Collection does not exist: '${name}'`);
  }
}

Store.serviceName = 'store';
Store.dependencies = ['metadata-manager', 'database', 'task-queue-manager'];
exports.Store = Store;

exports.getStoreCollection = (name) => getService('store').collection(name);
