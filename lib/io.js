'use strict';

const { createLogger } = require('./logging');
const { getService } = require('./service-manager');

const logger = createLogger('mylife:tools:server:io');

class IOSession {
  constuctor(session, socket) {
    this.session = session;
    this.socket = socket;

    this.socket.on('error', err => this._onError(err));
    this.socket.on('disconnect', () => this._onDisconnect());
    this.socket.on('message', raw => this._onMessage(raw));
  }

  close() {
    this.socket.disconnect(true);
  }

  _onError(err) {
    logger.error(`Socket error on session #${this.session.id}: ${err.stack}`);
  }

  async _onDisconnect() {
    // TODO: or run on task queue ?
    const sessionManager = getService('session-manager');
    await sessionManager.closeSession(this.session);
  }

  _onMessage(raw) {
    logger.debug(`Receive raw message on session #${this.session.id} => ${raw}`);

    let message;
    try {
      message = deserialize(raw);
    } catch(err) {
      logger.error(`Bad raw message received on session #${this.session.id}: ${err.stack}`);
    }

    try {
      dispatcher(this.session, message);
    } catch(err) {
      logger.error(`Unhandled error on message dispatch for session #${this.session.id}: ${err.stack}`);
    }
  }

  send(payload) {
    try {
      const raw = serialize(payload);
      logger.debug(`Emit raw message on session #${this.session.id} => ${raw}`);
      this.mobject.messageSent();
      this.socket.emit('message', raw);
    } catch(err) {
      logger.error(`Cannot send message for session #${this.session.id}: ${err.stack}`);
    }
  }
}

exports.IO = class IO {
  async init() {
  }

  async terminate() {
  }

  newSocket(socket) {
    const sessionManager = getService('session-manager');
    const session = sessionManager.newSession();
    session.io = session.registerClosable(new IOSession(session, socket));
  }

  get name() {
    return 'io';
  }
};

function serialize(content) {
  return content;
}

function deserialize(raw) {
  return raw;
}
