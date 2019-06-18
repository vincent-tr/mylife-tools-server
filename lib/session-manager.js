'use strict';

const { createLogger } = require('./logging');

const logger = createLogger('mylife:tools:server:session-manager');

class Session {
  constructor(id) {
    this.id = id;
    this._onTerminate = [];
  }

  registerTerminateCallback(cb) {
    this._onTerminate.push(cb);
    return cb;
  }

  registerClosable(obj) {
    this._onTerminate.push(() => obj.close());
    return obj;
  }

  async terminate() {
    for(const cb of this._onTerminate) {
      try {
        await cb();
      } catch(err) {
        logger.error(`Error while closing session ${this.id}: ${err.stack}`);
      }
    }
    this._onTerminate = null;
  }
}

class SessionManager {
  async init() {
    this._sessions = new Map();
    this._idGenerator = 0;
  }

  async terminate() {
  }

  newSession() {
    const id = ++this._idGenerator;
    const session = new Session(id);
    this._sessions.set(session.id, session);
    logger.debug(`New session #${session.id}`);
    return session;
  }

  async closeSession(session) {
    const { id } = session;
    this._sessions.sessions.delete(id);
    await session.terminate();
    logger.debug(`Session #${id} closed`);
  }
}

SessionManager.serviceName = 'session-manager';
exports.SessionManager = SessionManager;
