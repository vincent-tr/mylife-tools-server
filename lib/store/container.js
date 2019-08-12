'use strict';

const EventEmitter = require('events');

exports.Container = class Container extends EventEmitter {
  constructor() {
    super();

    this._items = new Map();
  }

  _reset() {
    this._items.clear();
  }

  _set(object) {
    const id = object._id;
    const existing = this.find(id);

    this._items.set(id, object);

    const event = { type: 'create', after: object };
    if(existing) {
      event.before = existing;
      event.type = 'update';
    }
    this.emit('change', event);

    return object;
  }

  _delete(id) {
    const existing = this.find(id);
    if(!existing) {
      return false;
    }

    this._items.delete(id);

    this.emit('change', { type: 'remove', before: existing });

    return true;
  }

  _replaceAll(objects) {
    const removeSet = new Set(this._items.keys());
    for(const object of objects) {
      removeSet.delete(object._id);
    }
    for(const id of removeSet) {
      this._delete(id);
    }

    for(const object of objects) {
      this._set(object);
      removeSet.delete(object._id);
    }
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

  get size() {
    return this._items.size;
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
