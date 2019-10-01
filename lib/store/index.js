'use strict';

const { createLogger } = require('../logging');
const { registerService, getService, fatal } = require('../service-manager');

const logger = createLogger('mylife:tools:server:store');

const { Container } = require('./container');
const { Collection } = require('./collection');
const { View } = require('./view');
const { deserializeObject, serializeObject, serializeObjectId } = require('./serializer');

async function bindCollection(collection) {
  logger.info(`loading database collection '${collection.name}' (entity='${collection.entity.id}', databaseCollection='${collection.databaseCollection.collectionName}')`);
  const cursor = collection.databaseCollection.find({});
  await cursor.forEach(record => {
    const object = deserializeObject(record, collection.entity);
    collection.load(object);
  });

  collection.databaseChangeStream = collection.databaseCollection.watch(null, { fullDocument: 'updateLookup' });
  collection.databaseChangeStream.on('change', (change) => handleChange(collection, change));

  collection.databaseUpdating = false;
}

async function unbindCollection(collection) {
  await collection.databaseChangeStream.close();
  collection.databaseChangeStream = null;
}

function handleChange(collection, change) {
  try {
    const id = change.documentKey && change.documentKey._id;
    logger.debug(`Database collection '${collection.name}' change (id='${id}', type='${change.operationType}')`);

    switch(change.operationType) {
      case 'insert':
      case 'replace':
      case 'update': {
        const record = change.fullDocument;
        const object = deserializeObject(record, collection.entity);
        
        collection.databaseUpdating = true;
        collection.set(object);
        collection.databaseUpdating = false;
        break;
      }

      case 'delete': {
        collection.databaseUpdating = true;
        collection.delete(id);
        collection.databaseUpdating = false;
        break;
      }


      case 'drop':
      case 'rename':
      case 'dropDatabase':
      case 'invalidate':
      default:
        throw new Error(`Unhandled database change stream operation type: '${change.operationType}`);
    }

  } catch(err) {
    // it is a fatal error if we could not handle database notifications properly
    fatal(err);
  }
}

function registerDatabaseUpdater(collection) {
  collection.on('change', event => {
    if (collection.databaseUpdating) {
      return; // do not persist if we are triggered from database update
    }

    const taskQueue = getService('task-queue-manager').getQueue('store');
    taskQueue.add(`${collection.name}/${event.type}`, async () => {
      try {
        await databaseUpdate(collection, event);
      } catch(err) {
        // it is a fatal error if background database update fails
        fatal(err);
      }
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

    case 'remove': {
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

      await bindCollection(collection);

      for(const index of indexes) {
        collection.setupIndex(index);
      }

      registerDatabaseUpdater(collection);
    }
  }

  async terminate() {
    await getService('task-queue-manager').closeQueue('store');

    for(const collection of this._collections.values()) {
      await unbindCollection(collection);
    }
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

registerService(Store);

exports.getStoreCollection = (name) => getService('store').collection(name);

exports.StoreView = View;
exports.StoreContainer = Container;
