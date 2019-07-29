'use strict';

const EventEmitter = require('events');

exports.Collection = class Collection extends EventEmitter {
  constructor(name) {
    super();

    this.name = name;

    this._items = new Map();
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

  values() {
    return this._items.values();
  }

};
