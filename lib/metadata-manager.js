'use strict';

const { registerService, getService } = require('./service-manager');
const { createLogger } = require('./logging');
const { metadata } = require('mylife-tools-common');

const logger = createLogger('mylife:tools:server:metadata-manager');

class MetadataManager {
  async init({ metadataDefintions }) {
    const { datatypes = [], entities = [] } = metadataDefintions || {};
    for(const datatype of datatypes) {
      metadata.registerDatatype(datatype);
      logger.debug(`datatype created: ${datatype.id}`);
    }
    for(const entity of entities) {
      metadata.registerEntity(entity);
      logger.debug(`entity created: ${entity.id}`);
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

registerService(MetadataManager);

exports.getMetadataEntity = id => getService('metadata-manager').getEntity(id);
exports.getMetadataDatatype = id => getService('metadata-manager').getDatatype(id);
