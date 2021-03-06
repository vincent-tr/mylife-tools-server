'use strict';

const { Container } = require('./container');

exports.View = class View extends Container {
  constructor(collection) {
    super();

    this.collection = collection;

    this._changeCallback = event => this._onCollectionChange(event);
    this.collection.on('change', this._changeCallback);
  }

  setFilter(filterCallback) {
    this.filterCallback = filterCallback;
    this.refresh();
  }

  refresh() {
    for(const object of this.collection.list()) {
      this._onCollectionChange({ type: 'update', before: object, after: object });
    }
  }

  _onCollectionChange({ before, after, type }) {
    switch(type) {
      case 'create': {
        if(this.filterCallback(after)) {
          this._set(after);
        }
        break;
      }

      case 'update': {
        if(this.filterCallback(after)) {
          this._set(after);
        } else {
          this._delete(before._id);
        }
        break;
      }

      case 'remove': {
        this._delete(before._id);
        break;
      }


      default:
        throw new Error(`Unsupported event type: '${type}'`);
    }
  }

  close() {
    this.collection.off('change', this._changeCallback);
    this._reset();
  }
};
