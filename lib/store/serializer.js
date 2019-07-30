'use strict';

exports.deserializeObject = deserializeObject;
exports.serializeObject = serializeObject;
exports.serializeObjectId = serializeObjectId;

const identity = x => x;

const serializers = {
  identifier: {
    serialize: (value, database) => (value && database.newObjectID(value)),
    deserialize: value => (value && value.toString())
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
    const value = getDatatypeSerializer(field.datatype).deserialize(raw);
    object = field.setValue(object, value);
  }
  return object;
}

function serializeObject(object, entity) {
  let record = {};
  for(const field of entity.fields) {
    const value = field.getValue(object);
    const raw = getDatatypeSerializer(field.datatype).serialize(value);
    field.setValueMutable(record, raw);
  }
  return record;
}

function serializeObjectId(object, entity) {
  const field = entity.getField('_id');
  const value = field.getValue(object);
  return getDatatypeSerializer(field.datatype).serialize(value);
}

function getDatatypeSerializer(datatype) {
  if(datatype.id === 'identifier' || datatype.primitive === 'reference') {
    return serializers.identifier;
  }
  return serializers.default;
}
