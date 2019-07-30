'use strict';

const EventEmitter = require('events');

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

  set(object) {
    const id = object._id;
    const existing = id && this.find(id);
    if(existing && existing._id !== id) {
      throw new Error(`Cannot change object on collection ${this.name} (before: ${existing._id}, after: ${id})`);
    }
    // TODO: check that object is of entity
    // TODO: generate id

    this._items.set(id, object);

    const event = { type: 'create', after: object };
    if(existing) {
      event.before = existing;
      event.type = 'update';
    }
    this.emit('change', event);
  }

  delete(id) {
    const existing = this.find(id);
    if(!existing) {
      return false;
    }

    this._items.delete(id);

    this.emit('change', { type: 'remove', before: existing });
  }
};
