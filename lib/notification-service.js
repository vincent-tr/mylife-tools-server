'use strict';

const { registerService, getService } = require('./service-manager');
const { createLogger } = require('./logging');

const logger = createLogger('mylife:tools:server:notification-service');

class SessionNotifications {
  constructor(session) {
    this.session = session;
    this.views = new Map();
    this.idGenerator = 0;
  }

  close() {
    for(const viewId of Array.from(this.views.keys())) {
      this.closeView(viewId);
    }
  }

  _notify(payload) {
    getService('io').getSessionIO(this.session).notify(payload);
  }

  _newId() {
    return ++this.idGenerator;
  }

  _onViewChange(viewId, { before, after, type }) {
    switch(type) {
      case 'create':
      case 'update':
        this._notify({ view: viewId, type: 'set', object: after });
        break;

      case 'remove':
        this._notify({ view: viewId, type: 'unset', objectId: before._id });
        break;

    default:
      throw new Error(`Unsupported event type: '${type}'`);
    }
  }

  registerView(view) {
    const id = this._newId();
    this.views.set(id, view);
    view.on('change', event => this._onViewChange(id, event));

    logger.debug(`View #${id} registered on session #${this.session.id}`);

    view.refresh();
    return id;
  }

  closeView(viewId) {
    const view = this.views.get(viewId);
    if(!view) {
      throw new Error(`Cannot remove unknown view #${viewId} from session #${this.session.id}`);
    }
    view.removeAllListeners();
    this.views.delete(viewId);
    view.close();

    logger.debug(`View #${viewId} unregistered from session #${this.session.id}`);
  }
}

function getNotifications(session) {
  if(!session.notifications) {
    session.notifications = session.registerClosable(new SessionNotifications(session));
  }
  return session.notifications;
}

class NotificationService {
  async init() {
  }

  async terminate() {
  }

  registerView(session, view) {
    return getNotifications(session).registerView(view);
  }

  closeView(session, viewId) {
    return getNotifications(session).CloseView(viewId);
  }
}

NotificationService.serviceName = 'notification-service';
NotificationService.dependencies = ['session-manager', 'store', 'io'];

registerService(NotificationService);

exports.notifyView = (session, view) => getService('notification-service').registerView(session, view);
exports.unnotifyView = (session, viewId) => getService('notification-service').closeView(session, viewId);
