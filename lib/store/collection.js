'use strict';

const { getService } = require('../service-manager');
const { View } = require('./view');
const { Container } = require('./container');

exports.Collection = class Collection extends Container {
  constructor(name, databaseCollection, entity) {
    super();

    this.name = name;
    this.databaseCollection = databaseCollection;
    this.entity = entity;
  }

  setupIndex(configuration) {
    // TODO
    void configuration;

    // https://www.npmjs.com/package/btreejs
  }

  load(object) {
    this._set(object);
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
      id = this.newId();
      object = this.entity.getField('_id').setValue(object, id);
    }

    this._set(object);

    return object;
  }

  delete(id) {
    return this._delete(id);
  }

  createView(filterCallback = () => true) {
    const view = new View(this);
    view.setFilter(filterCallback);
    return view;
  }

  newId() {
    return getService('database').newObjectID().toString();
  }
};
