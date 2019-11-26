'use strict';

const { utils } = require('mylife-tools-common');
const { getService } = require('../service-manager');

exports.deserializeObject = deserializeObject;
exports.serializeObject = serializeObject;
exports.serializeObjectId = serializeObjectId;

const identity = x => x;

const serializers = {
  identifier: {
    serialize: value => (value && getService('database').newObjectID(value)),
    deserialize: value => (value && value.toString())
  },

  binary: {
    serialize: value => (value && getService('database').newBinary(value)),
    deserialize: value => (value && value.buffer)
  },

  list: {
    serialize: (value, datatype) => (value && value.map(item => serializeValue(datatype.item, item))),
    deserialize: (value, datatype) => (value && value.map(item => deserializeValue(datatype.item, item)))
  },

  map: {
    serialize: (value, datatype) => (value && utils.objectMapValues(value, item => serializeValue(datatype.item, item))),
    deserialize: (value, datatype) => (value && utils.objectMapValues(value, item => deserializeValue(datatype.item, item)))
  },

  structure: {
    serialize: (value, datatype) => (value && serializeStructure(datatype, value)),
    deserialize: (value, datatype) => (value && deserializeStructure(datatype, value))
  },

  default: {
    serialize : identity,
    deserialize : identity,
  }
}

function deserializeObject(record, entity) {
  let object = entity.newObject();
  for(const field of entity.fields) {
    const raw = field.getValue(record);
    const value = deserializeValue(field.datatype, raw);
    object = field.setValue(object, undefinedToNull(value));
  }
  return object;
}

function serializeObject(object, entity) {
  let record = {};
  for(const field of entity.fields) {
    const value = field.getValue(object);
    const raw = serializeValue(field.datatype, value);
    field.setValueMutable(record, raw);
  }

  // do not store nulls
  for(const [key, value] of Object.entries(record)) {
    if(value === null) {
      delete record[key];
    }
  }

  return record;
}

function serializeObjectId(object, entity) {
  const field = entity.getField('_id');
  const value = field.getValue(object);
  return getDatatypeSerializer(field.datatype).serialize(value);
}

function deserializeValue(datatype, raw) {
  const serializer = getDatatypeSerializer(datatype);
  return serializer.deserialize(raw, datatype);
}

function serializeValue(datatype, value) {
  const serializer = getDatatypeSerializer(datatype);
  return serializer.serialize(value, datatype);
}

function getDatatypeSerializer(datatype) {
  if(datatype.id === 'identifier' || datatype.primitive === 'reference') {
    return serializers.identifier;
  }

  const serializer = serializers[datatype.primitive];
  if(serializer) {
    return serializer;
  }

  return serializers.default;
}

function serializeStructure(datatype, value) {
  const raw = {};
  for(const { id, datatype: fieldType } of datatype.fields) {
    const rawValue = serializeValue(fieldType, value[id]);
    if(rawValue !== null) {
      raw[id] = rawValue;
    }
  }
  return raw;
}

function deserializeStructure(datatype, raw) {
  const value = {};
  for(const { id, datatype: fieldType } of datatype.fields) {
    value[id] = undefinedToNull(deserializeValue(fieldType, raw[id]));
  }
  return value;
}

function undefinedToNull(value) {
  return value === undefined ? null : value;
}
