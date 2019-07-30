'use strict';

const EventEmitter = require('events');
const { getService } = require('../service-manager');

exports.Collection = class Collection extends EventEmitter {
  constructor(name, databaseCollection, entity) {
    super();

    this.name = name;
    this.databaseCollection = databaseCollection;
    this.entity = entity;

    this._items = new Map();
  }

  setupIndex(configuration) {
    // TODO
    void configuration;

    // https://www.npmjs.com/package/btreejs
  }

  load(object) {
    this._items.set(object._id, object);
  }

  set(object) {
    if(object._entity !== this.entity.id) {
      throw new Error(`Cannot set object of entity '${object._entity}' on collection '${this.name}', expected '${this.entity.id}' entity type`);
    }

    let id = object._id;
    const existing = id && this.find(id);
    if(!existing && id) {
      throw new Error(`Cannot create object on collection '${this.name}' because its id is already set`);
    }

    if(!id) {
      id = newId();
      object = this.entity.getField('_id').setValue(object, id);
    }

    this._items.set(id, object);

    const event = { type: 'create', after: object };
    if(existing) {
      event.before = existing;
      event.type = 'update';
    }
    this.emit('change', event);

    return object;
  }

  delete(id) {
    const existing = this.find(id);
    if(!existing) {
      return false;
    }

    this._items.delete(id);

    this.emit('change', { type: 'remove', before: existing });
  }

  find(id) {
    return this._items.get(id);
  }

  get(id) {
    const object = this.find(id);
    if(object) {
      return object;
    }
    throw new Error(`Object with id '${id}' not found on collection '${this.name}'`);
  }

  list() {
    return Array.from(this._items.values());
  }

  filter(callback) {
    const array = [];
    for(const value of this._items.values()) {
      if(callback(value)) {
        array.push(value);
      }
    }
    return array;
  }

  exists(callback) {
    for(const value of this._items.values()) {
      if(callback(value)) {
        return true;
      }
    }
    return false;
  }

};

function newId() {
  return getService('database').newObjectID().toString();
}
