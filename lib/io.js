'use strict';

const { createLogger } = require('./logging');
const { getService } = require('./service-manager');
const { serializer } = require('mylife-tools-common');

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
      message = serializer.deserialize(raw);
    } catch(err) {
      logger.error(`Bad raw message received on session #${this.session.id}: ${err.stack}`);
    }

    try {
      this._dispatch(message);
    } catch(err) {
      logger.error(`Unhandled error on message dispatch for session #${this.session.id}: ${err.stack}`);
    }
  }

  send(payload) {
    try {
      const raw = serializer.serialize(payload);
      logger.debug(`Emit raw message on session #${this.session.id} => ${raw}`);
      this.mobject.messageSent();
      this.socket.emit('message', raw);
    } catch(err) {
      logger.error(`Cannot send message for session #${this.session.id}: ${err.stack}`);
    }
  }

  _dispatch(message) {
    if(message.engine !== 'call') {
      return;
    }

    const apiRegistry = getService('api-registry');
    const taskQueue = getService('task-queue');

    try {
      const method = apiRegistry.lookup(message.service, message.method);
      taskQueue.add(`${method.service.name}/${method.name}`, async () => {
        try {
          const result = await method.call(this.session, message);
          this.send(createReply(message, { result }));
        } catch(err) {
          logger.error(`Service method error for session #${this.session.id}: ${err.stack}`);
          this.send(createErrorReply(message, err));
        }
      });

    } catch(err) {
      logger.error(`Dispatch error for session #${this.session.id}: ${err.stack}`);
      this.send(createErrorReply(message, err));
    }

  }
}


class IO {
  async init() {
  }

  async terminate() {
  }

  newSocket(socket) {
    const sessionManager = getService('session-manager');
    const session = sessionManager.newSession();
    session.io = session.registerClosable(new IOSession(session, socket));
  }
}

IO.serviceName = 'io';
IO.dependencies = ['api-registry', 'task-queue', 'session-manager'];
exports.IO = IO;

function serialize(content) {
  // TODO
  return content;
}

function deserialize(raw) {
  // TODO
  return raw;
}


function createReply(input, data = {}) {
  return {
    engine      : 'call',
    transaction : input.transaction,
    ... data
  };
}

function createErrorReply(input, err) {
  return createReply(input, { error : err });
}
