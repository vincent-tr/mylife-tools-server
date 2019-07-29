'use strict';

const { createLogger } = require('./logging');
const { metadata } = require('mylife-tools-common');

const logger = createLogger('mylife:tools:server:metadata-manager');

class MetadataManager {
  async init({ metadataDefintions }) {
    const { datatypes = [], entities = [] } = metadataDefintions || {};
    for(const datatype of datatypes) {
      metadata.registerDatatype(datatype);
      logger.info(`datatype created: ${datatype.id}`);
    }
    for(const entity of entities) {
      metadata.registerDatatype(entity);
      logger.info(`entity created: ${entity.id}`);
    }
  }

  async terminate() {
  }

  getEntity(id) {
    return metadata.getEntity(id);
  }

  getDatatype(id) {
    return metadata.getDatatype(id);
  }
}

MetadataManager.serviceName = 'metadata-manager';
exports.MetadataManager = MetadataManager;
